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

  // Deduplicate by Stripe event ID
  const { error: dedupeError } = await admin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
    })

  if (dedupeError) {
    if (dedupeError.code === "23505") { // Postgres unique_violation
      console.log(`[stripe webhook] Ignored duplicate event: ${event.id}`)
      return NextResponse.json({ received: true })
    }
    console.error("[stripe webhook] Failed to deduplicate event:", dedupeError)
    // Continue processing if it's not a unique violation, to allow Stripe to retry if there's an actual failure down the line,
    // or fail here. Let's fail to be safe and let Stripe retry.
    return NextResponse.json({ error: "Failed to process event." }, { status: 500 })
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
  } catch (e) {
    console.error("[stripe webhook]", e)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
