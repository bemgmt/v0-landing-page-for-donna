import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { STRIPE_PRICE_LOOKUP_CORE, STRIPE_PRICE_LOOKUP_FULL } from "@/lib/billing/plan-seats"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

async function createCheckoutSession(params: {
  tier: "core" | "full"
  promoCode?: string
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bemdonna.com").replace(/\/$/, "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon)

  if (!secretKey?.trim()) {
    console.error("[checkout] Missing STRIPE_SECRET_KEY")
    return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY on the server.", code: "STRIPE_ENV", status: 503 }
  }

  const lookupKey =
    params.tier === "full"
      ? (process.env.STRIPE_PRICE_LOOKUP_FULL?.trim() || STRIPE_PRICE_LOOKUP_FULL)
      : (process.env.STRIPE_PRICE_LOOKUP_CORE?.trim() || STRIPE_PRICE_LOOKUP_CORE)

  try {
    let user: { id: string; email?: string | null; cognito_sub?: string | null } | null = null
    const authSession = await getServerSession(authOptions)
    if (!authSession?.user || !(authSession as any).cognito_sub) {
      return { error: "Unauthorized: You must be logged in to create a checkout session.", code: "UNAUTHORIZED", status: 401 }
    }

    if (authSession?.user) {
      user = {
        id: (authSession as any).cognito_sub || authSession.user.email || "",
        email: authSession.user.email,
        cognito_sub: (authSession as any).cognito_sub
      }
    }

    const supabase = supabaseConfigured ? createAdminClient() : null
    if (!supabase) {
      return { error: "The portal profile store is not configured.", code: "PROFILE_STORE", status: 503 }
    }

    let memberProfile: { id: string; user_id: string | null; cognito_sub: string | null } | null = null

    if (supabase && user?.cognito_sub) {
      const { data, error } = await supabase
        .from("member_profiles")
        .select("id, user_id, cognito_sub")
        .eq("cognito_sub", user.cognito_sub)
        .maybeSingle()

      if (error) {
        console.error("[checkout] Cognito profile lookup failed", error)
        return { error: "Your portal profile could not be loaded.", code: "PROFILE_LOOKUP", status: 500 }
      }
      if (!data) {
        return {
          error: "Your portal profile is still being prepared. Open the portal and try checkout again.",
          code: "PROFILE_NOT_READY",
          status: 409,
        }
      }
      memberProfile = data
    }

    if (!memberProfile) {
      return {
        error: "Your portal profile is still being prepared. Open the portal and try checkout again.",
        code: "PROFILE_NOT_READY",
        status: 409,
      }
    }
    const stripe = new Stripe(secretKey)

    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    })
    let priceId = prices.data[0]?.id ?? null

    if (!priceId && params.tier === "core") {
      const legacy = process.env.STRIPE_PRICE_ID?.trim()
      if (legacy) priceId = legacy
    }

    if (!priceId) {
      console.error("[checkout] No Stripe price for lookup_key:", lookupKey)
      return {
        error: `No active Stripe price found for lookup_key "${lookupKey}". Set lookup_key on the Price in Stripe Dashboard (Products â†’ Price â†’ Lookup key) and/or set STRIPE_PRICE_LOOKUP_CORE / STRIPE_PRICE_LOOKUP_FULL.`,
        code: "STRIPE_PRICE_LOOKUP",
        status: 503,
      }
    }

    // Look up stripe promotion code ID if a promo code is passed
    let stripePromoCodeId: string | null = null
    if (params.promoCode && supabase) {
      const { data: promoCodeRow } = await supabase
        .from("promo_codes")
        .select("code, stripe_promotion_code_id")
        .ilike("code", params.promoCode.trim())
        .eq("status", "active")
        .maybeSingle()

      if (promoCodeRow) {
        if (promoCodeRow.stripe_promotion_code_id) {
          stripePromoCodeId = promoCodeRow.stripe_promotion_code_id
        } else {
          // Backup search via Stripe API
          const list = await stripe.promotionCodes.list({
            code: promoCodeRow.code,
            active: true,
            limit: 1,
          })
          stripePromoCodeId = list.data[0]?.id ?? null
        }
      }
    }

    const successUrl = "https://app.bemdonna.com"
    const cancelUrl = user ? `${baseUrl}/portal?checkout=canceled` : `${baseUrl}/?checkout=canceled`

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    }

    if (stripePromoCodeId) {
      sessionParams.discounts = [{ promotion_code: stripePromoCodeId }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    if (user) {
      sessionParams.client_reference_id = memberProfile.id

      let billingAccountId = ""
      let stripeCustomerId = ""
      if (supabase && user?.cognito_sub) {
        const { data: billingAccount } = await supabase
          .from("billing_accounts")
          .select("id, stripe_customer_id")
          .eq("member_profile_id", memberProfile.id)
          .maybeSingle()
        billingAccountId = billingAccount?.id ?? ""
        stripeCustomerId = billingAccount?.stripe_customer_id ?? ""
      }

      const identityMetadata: Record<string, string> = {
        member_profile_id: memberProfile.id,
        cognito_sub: user.cognito_sub || "",
        email: user.email || "",
        ...(billingAccountId ? { billing_account_id: billingAccountId } : {}),
      }
      if (memberProfile.user_id) {
        identityMetadata.supabase_user_id = memberProfile.user_id
      }

      sessionParams.metadata = identityMetadata
      sessionParams.subscription_data = { metadata: identityMetadata }

      if (stripeCustomerId) {
        sessionParams.customer = stripeCustomerId
      } else if (user.email) {
        sessionParams.customer_email = user.email
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return { error: "Checkout session missing URL.", code: "STRIPE_NO_URL", status: 500 }
    }

    return { url: session.url }
  } catch (e) {
    console.error("[checkout]", e)
    const message = e instanceof Error ? e.message : "Checkout failed"
    return { error: message, code: "CHECKOUT", status: 500 }
  }
}

export async function POST(request: Request) {
  let tier: "core" | "full" = "core"
  let promoCode: string | undefined = undefined

  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const raw = (await request.json().catch(() => null)) as { tier?: unknown; promo?: unknown } | null
    if (raw && typeof raw === "object") {
      if (raw.tier === "full") tier = "full"
      if (typeof raw.promo === "string" && raw.promo.trim()) promoCode = raw.promo
    }
  }

  const result = await createCheckoutSession({ tier, promoCode })
  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
  }
  return NextResponse.json({ url: result.url })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const promo = searchParams.get("promo") ?? undefined
  const tierRaw = searchParams.get("tier")
  const tier: "core" | "full" = tierRaw === "full" ? "full" : "core"

  const result = await createCheckoutSession({ tier, promoCode: promo })
  if ("error" in result) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bemdonna.com"
    return NextResponse.redirect(`${baseUrl}/?checkout=error&msg=${encodeURIComponent(result.error || "Checkout failed")}`)
  }
  return NextResponse.redirect(result.url)
}

