import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getPortalSession } from "@/lib/portal/session"

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bemdonna.com").replace(/\/$/, "")

  if (!secretKey?.trim()) {
    return NextResponse.json(
      { error: "Stripe is not configured.", code: "STRIPE_ENV" },
      { status: 503 },
    )
  }

  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { billing, seatAccess } = session

  if (seatAccess) {
    return NextResponse.json(
      { error: "Only the subscription owner can manage billing." },
      { status: 403 },
    )
  }

  if (!billing?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer linked to your account yet." },
      { status: 404 },
    )
  }

  try {
    const stripe = new Stripe(secretKey)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${baseUrl}/portal/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (e) {
    console.error("[billing-portal]", e)
    const message = e instanceof Error ? e.message : "Could not open billing portal."
    return NextResponse.json({ error: message, code: "BILLING_PORTAL" }, { status: 500 })
  }
}
