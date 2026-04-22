import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { MemberRole } from "@/lib/auth/roles"
import { isRole } from "@/lib/auth/roles"

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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { kind: "unauthenticated" }

  const { data: rawProfile, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[portal] member_profiles lookup failed", error)
    return { kind: "no_member_profile", user: { id: user.id, email: user.email } }
  }

  if (!rawProfile) {
    return { kind: "no_member_profile", user: { id: user.id, email: user.email } }
  }

  const roleRaw = rawProfile.role
  const role = isRole(roleRaw) ? roleRaw : "free_member"

  const profile = {
    ...rawProfile,
    role,
  } as MemberProfileRow

  const { data: billing } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  let subscriptionActive = billing?.status === "active" || billing?.status === "trialing"
  let seatAccess = false

  if (!subscriptionActive) {
    const { data: invited, error: seatInviteError } = await supabase.rpc("billing_user_has_active_seat_invite")
    if (!seatInviteError && invited === true) {
      subscriptionActive = true
      seatAccess = true
    }
  }

  const session: PortalSession = {
    supabase,
    user: { id: user.id, email: user.email },
    profile,
    billing: billing as BillingRow | null,
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
