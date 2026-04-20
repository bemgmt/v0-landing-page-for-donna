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
}

export type PortalSession = {
  supabase: SupabaseClient
  user: { id: string; email?: string | null }
  profile: MemberProfileRow
  billing: BillingRow | null
  subscriptionActive: boolean
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rawProfile, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !rawProfile) return null

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

  const subscriptionActive =
    billing?.status === "active" || billing?.status === "trialing"

  return {
    supabase,
    user: { id: user.id, email: user.email },
    profile,
    billing: billing as BillingRow | null,
    subscriptionActive,
  }
}
