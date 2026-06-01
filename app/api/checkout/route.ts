import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { STRIPE_PRICE_LOOKUP_CORE, STRIPE_PRICE_LOOKUP_FULL } from "@/lib/billing/plan-seats"

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bemdonna.com").replace(/\/$/, "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

  if (!secretKey?.trim()) {
    console.error("[checkout] Missing STRIPE_SECRET_KEY")
    return NextResponse.json(
      {
        error: "Stripe is not configured. Set STRIPE_SECRET_KEY on the server.",
        code: "STRIPE_ENV",
      },
      { status: 503 },
    )
  }

  let tier: "core" | "full" = "core"
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const raw = (await request.json().catch(() => null)) as { tier?: unknown } | null
    if (raw && typeof raw === "object" && raw.tier === "full") tier = "full"
  }

  const lookupKey =
    tier === "full"
      ? (process.env.STRIPE_PRICE_LOOKUP_FULL?.trim() || STRIPE_PRICE_LOOKUP_FULL)
      : (process.env.STRIPE_PRICE_LOOKUP_CORE?.trim() || STRIPE_PRICE_LOOKUP_CORE)

  try {
    let user: { id: string; email?: string | null } | null = null
    if (supabaseConfigured) {
      const supabase = await createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) user = { id: authUser.id, email: authUser.email }
    }

    const stripe = new Stripe(secretKey)

    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    })
    let priceId = prices.data[0]?.id ?? null

    if (!priceId && tier === "core") {
      const legacy = process.env.STRIPE_PRICE_ID?.trim()
      if (legacy) priceId = legacy
    }

    if (!priceId) {
      console.error("[checkout] No Stripe price for lookup_key:", lookupKey)
      return NextResponse.json(
        {
          error: `No active Stripe price found for lookup_key "${lookupKey}". Set lookup_key on the Price in Stripe Dashboard (Products → Price → Lookup key) and/or set STRIPE_PRICE_LOOKUP_CORE / STRIPE_PRICE_LOOKUP_FULL.`,
          code: "STRIPE_PRICE_LOOKUP",
        },
        { status: 503 },
      )
    }

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
      if (user.email) {
        sessionParams.customer_email = user.email
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
