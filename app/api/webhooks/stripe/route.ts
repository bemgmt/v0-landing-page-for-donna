import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  syncCustomerRecord,
  syncFromCheckoutSession,
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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncFromCheckoutSession(admin, event.data.object as Stripe.Checkout.Session, stripe)
        break
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscriptionWebhook(admin, event.data.object as Stripe.Subscription, stripe)
        break
      case "customer.updated":
      case "customer.created":
        await syncCustomerRecord(admin, event.data.object as Stripe.Customer)
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
