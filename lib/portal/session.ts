import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { MemberRole } from "@/lib/auth/roles"
import { isRole } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { autoSyncUserSubscription } from "@/lib/billing/stripe-sync"

export type MemberProfileRow = {
  id: string
  user_id: string | null
  cognito_sub: string | null
  role: MemberRole
  display_name: string | null
  email: string | null
  avatar_url: string | null
  company_name: string | null
  bio: string | null
  phone: string | null
  website_url: string | null
  partner_via_stripe: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  intern_tasks: { tasks: { id: string; week: number; label: string; completed: boolean }[] } | null
}

export type BillingRow = {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: string
  current_period_end: string | null
  updated_at: string
  price_lookup_key?: string | null
  stripe_price_id?: string | null
}

export type PortalSession = {
  supabase: SupabaseClient
  user: { id: string; cognitoSub: string | null; email?: string | null }
  profile: MemberProfileRow
  billing: BillingRow | null
  subscriptionActive: boolean
  /** True when partner access comes from a team seat invite (not the Stripe purchaser). */
  seatAccess: boolean
}

/** Resolved for layouts: avoids redirect loops when the user is signed in but `member_profiles` is missing. */
export type PortalLayoutState =
  | { kind: "missing_supabase_env" }
  | { kind: "unauthenticated" }
  | { kind: "no_member_profile"; user: { id: string; email: string | null | undefined } }
  | { kind: "ready"; session: PortalSession }

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function resolvePortalLayoutState(): Promise<PortalLayoutState> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.trim() || !anon?.trim()) {
    return { kind: "missing_supabase_env" }
  }

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return { kind: "missing_supabase_env" }
  }

  const authSession = await getServerSession(authOptions)
  if (!authSession?.user || !authSession.user.email) return { kind: "unauthenticated" }

  const email = authSession.user.email
  const cognitoSub = (authSession as any).cognito_sub

  const admin = createAdminClient()

  if (!cognitoSub || typeof cognitoSub !== "string") {
    return { kind: "no_member_profile", user: { id: email, email } }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const { data: profileBySubject, error: subjectLookupError } = await admin
    .from("member_profiles")
    .select("*")
    .eq("cognito_sub", cognitoSub)
    .maybeSingle()

  if (subjectLookupError) {
    console.error("[portal] member_profiles Cognito lookup failed", subjectLookupError)
    return { kind: "no_member_profile", user: { id: cognitoSub, email } }
  }

  let rawProfile = profileBySubject

  if (!rawProfile) {
    const { data: emailCandidates, error: emailLookupError } = await admin
      .from("member_profiles")
      .select("*")
      .ilike("email", normalizedEmail)
      .limit(2)

    if (emailLookupError) {
      console.error("[portal] legacy member profile lookup failed", emailLookupError)
      return { kind: "no_member_profile", user: { id: cognitoSub, email } }
    }

    const exactCandidates = (emailCandidates ?? []).filter(
      (candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail,
    )
    const legacyProfile = exactCandidates.length === 1 ? exactCandidates[0] : null

    if (legacyProfile && !legacyProfile.cognito_sub) {
      const { data: claimedProfile, error: claimError } = await admin
        .from("member_profiles")
        .update({ cognito_sub: cognitoSub, email: normalizedEmail })
        .eq("id", legacyProfile.id)
        .is("cognito_sub", null)
        .select("*")
        .maybeSingle()

      if (claimError) {
        console.error("[portal] legacy profile Cognito claim failed", claimError)
      }
      rawProfile = claimedProfile
    }
  }

  if (!rawProfile) {
    const displayName = normalizedEmail.split("@")[0]
    const { data: newProfile, error: insertError } = await admin
      .from("member_profiles")
      .insert({
        user_id: null,
        cognito_sub: cognitoSub,
        email: normalizedEmail,
        display_name: displayName,
        role: "free_member",
        is_active: true,
      })
      .select("*")
      .single()

    if (insertError || !newProfile) {
      const { data: concurrentlyCreated } = await admin
        .from("member_profiles")
        .select("*")
        .eq("cognito_sub", cognitoSub)
        .maybeSingle()

      if (!concurrentlyCreated) {
        console.error("[portal] auto-provision member_profiles failed", insertError)
        return { kind: "no_member_profile", user: { id: cognitoSub, email } }
      }
      rawProfile = concurrentlyCreated
    } else {
      rawProfile = newProfile
    }
  }
  const roleRaw = rawProfile.role
  const role = isRole(roleRaw) ? roleRaw : "free_member"
  const billingIdentityId = cognitoSub || rawProfile.user_id || rawProfile.id

  const profile = {
    ...rawProfile,
    role,
  } as MemberProfileRow

  let billingRow: BillingRow | null = null
  let subscriptionActive = false
  let seatAccess = false

  if (email || cognitoSub) {
    try {
      const resp = await fetch("https://bjeqnokehrjviowntlng.supabase.co/functions/v1/billing-status", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DONNA_BILLING_TOKEN || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cognito_sub: cognitoSub || undefined,
          email: email?.trim(),
          requested_at: new Date().toISOString(),
          contract_version: "2026-07-08"
        }),
        cache: "no-store"
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data.account_status === "active" || data.account_status === "trialing") {
          subscriptionActive = true
          seatAccess = data.seat_type === "invite"
        }
        billingRow = {
          id: "",
          user_id: billingIdentityId,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id ?? null,
          status: data.account_status,
          current_period_end: data.current_period_end,
          updated_at: data.source_of_truth_at,
          price_lookup_key: data.plan,
        }
      } else {
        console.error("[portal] billing status fetch returned", resp.status)
        // Auto sync if not found/failed? 
        if (email) await autoSyncUserSubscription(admin, billingIdentityId, email)
      }
    } catch (err) {
      console.error("[portal] billing status fetch failed", err)
    }
  }

  const session: PortalSession = {
    supabase,
    user: { id: rawProfile.id, cognitoSub, email },
    profile,
    billing: billingRow,
    subscriptionActive,
    seatAccess,
  }

  return { kind: "ready", session }
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const state = await resolvePortalLayoutState()
  if (state.kind !== "ready") return null
  return state.session
}
