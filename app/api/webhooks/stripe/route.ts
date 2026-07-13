import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  syncCustomerRecord,
  syncFromCheckoutSession,
  syncInvoiceSubscription,
  syncSubscriptionWebhook,
} from "@/lib/billing/stripe-sync"

export const runtime = "nodejs"

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

  const admin = createAdminClient()
  const { data: claim, error: claimError } = await admin.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: event.id,
    p_event_type: event.type,
    p_stale_after_seconds: 300,
  })

  if (claimError) {
    console.error("[stripe webhook] Failed to claim event:", claimError)
    return NextResponse.json({ error: "Failed to claim event." }, { status: 500 })
  }
  if (claim === "completed" || claim === "processing") {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncFromCheckoutSession(admin, event.data.object as Stripe.Checkout.Session, stripe)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscriptionWebhook(admin, event.data.object as Stripe.Subscription, stripe)
        break
      case "customer.updated":
      case "customer.created":
        await syncCustomerRecord(admin, event.data.object as Stripe.Customer)
        break
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        await syncInvoiceSubscription(admin, event.data.object as Stripe.Invoice, stripe)
        break
      default:
        break
    }
  } catch (error) {
    console.error("[stripe webhook]", error)
    await admin.from("stripe_webhook_events").update({
      status: "failed",
      last_error: error instanceof Error ? error.message.slice(0, 2000) : "Unknown webhook error",
      updated_at: new Date().toISOString(),
    }).eq("stripe_event_id", event.id)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  const completedAt = new Date().toISOString()
  const { error: completionError } = await admin.from("stripe_webhook_events").update({
    status: "completed",
    completed_at: completedAt,
    last_error: null,
    updated_at: completedAt,
  }).eq("stripe_event_id", event.id)

  if (completionError) {
    console.error("[stripe webhook] Failed to mark event completed:", completionError)
    return NextResponse.json({ error: "Failed to complete event." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
