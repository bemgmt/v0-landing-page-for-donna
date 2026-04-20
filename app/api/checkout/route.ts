import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bemdonna.com").replace(/\/$/, "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.trim() || !supabaseAnon?.trim()) {
    console.error("[checkout] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    return NextResponse.json(
      {
        error:
          "Sign-in is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        code: "SUPABASE_ENV",
      },
      { status: 503 },
    )
  }

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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required. Use Portal in the header, then try checkout again.", code: "AUTH" },
        { status: 401 },
      )
    }

    const stripe = new Stripe(secretKey)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/portal?checkout=success`,
      cancel_url: `${baseUrl}/portal?checkout=canceled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

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
