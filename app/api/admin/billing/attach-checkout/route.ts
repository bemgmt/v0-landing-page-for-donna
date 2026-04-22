import { NextResponse } from "next/server"
import Stripe from "stripe"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncFromCheckoutSession } from "@/lib/billing/stripe-sync"
import { z } from "zod"

const bodySchema = z.object({
  stripe_checkout_session_id: z.string().min(1),
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
  const sessionId = parsed.data.stripe_checkout_session_id.trim()

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })
  } catch {
    return NextResponse.json({ error: "Checkout session not found in Stripe." }, { status: 404 })
  }

  await syncFromCheckoutSession(admin, checkoutSession, stripe)

  await admin.from("audit_events").insert({
    actor_profile_id: session.profile.id,
    event_type: "billing_attach_checkout",
    entity_type: "stripe_checkout_session",
    entity_id: checkoutSession.id,
    payload: { stripe_checkout_session_id: checkoutSession.id },
  })

  return NextResponse.json({ ok: true })
}
