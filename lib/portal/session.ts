import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { MemberRole } from "@/lib/auth/roles"
import { isRole } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { autoSyncUserSubscription } from "@/lib/billing/stripe-sync"

export type MemberProfileRow = {
  id: string
  user_id: string
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
  user: { id: string; email?: string | null }
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

  // Use email to find the member_profile since Cognito is now the identity provider.
  const { data: rawProfile, error } = await admin
    .from("member_profiles")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle()

  if (error) {
    console.error("[portal] member_profiles lookup failed", error)
    return { kind: "no_member_profile", user: { id: cognitoSub || email, email } }
  }

  if (!rawProfile) {
    return { kind: "no_member_profile", user: { id: cognitoSub || email, email } }
  }

  const roleRaw = rawProfile.role
  const role = isRole(roleRaw) ? roleRaw : "free_member"
  const userId = rawProfile.user_id

  const profile = {
    ...rawProfile,
    role,
  } as MemberProfileRow

  const { data: billing } = await admin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  let billingRow = billing as BillingRow | null

  if (!billingRow && email) {
    await autoSyncUserSubscription(admin, userId, email)

    const { data: reFetchedBilling } = await admin
      .from("billing_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
    billingRow = reFetchedBilling as BillingRow | null
  }

  let subscriptionActive = billingRow?.status === "active" || billingRow?.status === "trialing"
  let seatAccess = false

  if (!subscriptionActive) {
    const { data: invite } = await admin
      .from("billing_seat_invites")
      .select("purchaser_user_id")
      .ilike("email", email.trim())
      .maybeSingle()

    if (invite?.purchaser_user_id) {
      const { data: purchaserSub } = await admin
        .from("billing_subscriptions")
        .select("status")
        .eq("user_id", invite.purchaser_user_id)
        .in("status", ["active", "trialing"])
        .maybeSingle()

      if (purchaserSub) {
        subscriptionActive = true
        seatAccess = true
      }
    }
  }

  const session: PortalSession = {
    supabase,
    user: { id: userId, email },
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
