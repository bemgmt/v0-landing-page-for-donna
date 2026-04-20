import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

async function upsertBilling(
  admin: ReturnType<typeof createAdminClient>,
  row: {
    user_id: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    status: string
    current_period_end: string | null
  },
) {
  await admin.from("billing_subscriptions").upsert(row, { onConflict: "user_id" })
}

async function syncFromCheckout(session: Stripe.Checkout.Session, stripe: Stripe) {
  const admin = createAdminClient()
  const userId =
    session.client_reference_id ??
    (typeof session.metadata?.supabase_user_id === "string" ? session.metadata.supabase_user_id : null)
  if (!userId) return

  const subRef = session.subscription
  const subId = typeof subRef === "string" ? subRef : subRef?.id
  if (!subId) return

  const subscription = await stripe.subscriptions.retrieve(subId)
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null

  await upsertBilling(admin, {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  })
}

async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient()
  let userId =
    typeof sub.metadata?.supabase_user_id === "string" ? sub.metadata.supabase_user_id : null

  if (!userId) {
    const { data } = await admin
      .from("billing_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle()
    userId = data?.user_id ?? null
  }

  if (!userId) return

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null

  await upsertBilling(admin, {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
  })
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey?.length || !webhookSecret?.length) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncFromCheckout(event.data.object as Stripe.Checkout.Session, stripe)
        break
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (e) {
    console.error("[stripe webhook]", e)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
