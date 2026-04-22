import { NextResponse } from "next/server"
import Stripe from "stripe"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncBillingFromSubscription } from "@/lib/billing/stripe-sync"
import { z } from "zod"

const bodySchema = z.object({
  stripe_subscription_id: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey?.trim()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)
  const admin = createAdminClient()
  const subId = parsed.data.stripe_subscription_id.trim()

  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price"],
    })
  } catch {
    return NextResponse.json({ error: "Subscription not found in Stripe." }, { status: 404 })
  }

  let userId =
    typeof subscription.metadata?.supabase_user_id === "string"
      ? subscription.metadata.supabase_user_id
      : null

  if (!userId) {
    const { data } = await admin
      .from("billing_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle()
    userId = data?.user_id ?? null
  }

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Cannot resolve member: subscription has no supabase_user_id metadata and no existing billing_subscriptions row for this subscription id.",
      },
      { status: 422 },
    )
  }

  await syncBillingFromSubscription(admin, subscription, userId, stripe)

  await admin.from("audit_events").insert({
    actor_profile_id: session.profile.id,
    event_type: "billing_sync_subscription",
    entity_type: "billing_subscriptions",
    entity_id: subscription.id,
    payload: { stripe_subscription_id: subscription.id, user_id: userId },
  })

  return NextResponse.json({ ok: true, user_id: userId })
}
