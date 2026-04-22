import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { planDisplayLabel, primaryPlanKey, seatsAllowanceForPlanKey } from "@/lib/billing/plan-seats"

export type SubscriptionPlanSnapshot = {
  planKey: string
  planLabel: string
  seatsAllowance: number
}

type BillingPlanSource = {
  stripe_subscription_id: string | null
  price_lookup_key?: string | null
  stripe_price_id?: string | null
}

export async function resolveSubscriptionPlan(
  supabase: SupabaseClient,
  billing: BillingPlanSource | null,
): Promise<SubscriptionPlanSnapshot> {
  if (!billing?.stripe_subscription_id) {
    return { planKey: "", planLabel: planDisplayLabel(""), seatsAllowance: 0 }
  }

  const { data: items } = await supabase
    .from("billing_subscription_items")
    .select("price_lookup_key, stripe_price_id")
    .eq("stripe_subscription_id", billing.stripe_subscription_id)
    .order("stripe_subscription_item_id", { ascending: true })
    .limit(1)

  const planKey = primaryPlanKey({
    price_lookup_key: billing.price_lookup_key ?? null,
    stripe_price_id: billing.stripe_price_id ?? null,
    items: items ?? [],
  })

  return {
    planKey,
    planLabel: planDisplayLabel(planKey),
    seatsAllowance: seatsAllowanceForPlanKey(planKey),
  }
}

/**
 * Plan for the purchaser who invited this email (active/trialing only).
 * Uses service role server-side after the caller has verified the session user.
 */
export async function resolveActiveSeatInvitePlan(
  userEmail: string | null | undefined,
): Promise<SubscriptionPlanSnapshot | null> {
  const email = userEmail?.trim().toLowerCase()
  if (!email) return null

  try {
    const admin = createAdminClient()
    const { data: invites, error: invErr } = await admin
      .from("billing_seat_invites")
      .select("purchaser_user_id")
      .eq("email", email)

    if (invErr || !invites?.length) return null

    for (const row of invites) {
      const uid = row.purchaser_user_id as string
      const { data: bs, error: subErr } = await admin
        .from("billing_subscriptions")
        .select("stripe_subscription_id, price_lookup_key, stripe_price_id, status")
        .eq("user_id", uid)
        .maybeSingle()

      if (subErr || !bs) continue
      if (bs.status !== "active" && bs.status !== "trialing") continue

      return await resolveSubscriptionPlan(admin, bs)
    }
    return null
  } catch {
    return null
  }
}
