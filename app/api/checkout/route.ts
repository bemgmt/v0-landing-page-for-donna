import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bemdonna.com").replace(/\/$/, "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

  if (!secretKey?.trim() || !priceId?.trim()) {
    console.error("[checkout] Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID")
    return NextResponse.json(
      {
        error: "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID on the server.",
        code: "STRIPE_ENV",
      },
      { status: 503 },
    )
  }

  try {
    let user: { id: string } | null = null
    if (supabaseConfigured) {
      const supabase = await createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) user = { id: authUser.id }
    }

    const stripe = new Stripe(secretKey)

    const successUrl = user
      ? `${baseUrl}/portal?checkout=success`
      : `${baseUrl}/?checkout=success`
    const cancelUrl = user ? `${baseUrl}/portal?checkout=canceled` : `${baseUrl}/?checkout=canceled`

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    }

    if (user) {
      sessionParams.client_reference_id = user.id
      sessionParams.metadata = { supabase_user_id: user.id }
      sessionParams.subscription_data = {
        metadata: { supabase_user_id: user.id },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session missing URL.", code: "STRIPE_NO_URL" }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("[checkout]", e)
    const message = e instanceof Error ? e.message : "Checkout failed"
    return NextResponse.json({ error: message, code: "CHECKOUT" }, { status: 500 })
  }
}
