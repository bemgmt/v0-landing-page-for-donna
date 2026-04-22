import { NextResponse } from "next/server"
import Stripe from "stripe"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { lookupMemberUserIdByEmail, syncBillingFromSubscription } from "@/lib/billing/stripe-sync"
import { z } from "zod"

const bodySchema = z.object({
  stripe_subscription_id: z.string().min(1),
  supabase_user_id: z.string().uuid().optional(),
})

type ResolutionSource = "metadata" | "billing_row" | "body" | "email"

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
  const subId = parsed.data.stripe_subscription_id.trim()

  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price"],
    })
  } catch {
    return NextResponse.json({ error: "Subscription not found in Stripe." }, { status: 404 })
  }

  const hadMetadataUser =
    typeof subscription.metadata?.supabase_user_id === "string" &&
    subscription.metadata.supabase_user_id.trim().length > 0

  let userId: string | null = hadMetadataUser ? subscription.metadata!.supabase_user_id!.trim() : null
  let resolutionSource: ResolutionSource | null = hadMetadataUser ? "metadata" : null

  if (!userId) {
    const { data } = await admin
      .from("billing_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle()
    if (data?.user_id) {
      userId = data.user_id
      resolutionSource = "billing_row"
    }
  }

  if (!userId && parsed.data.supabase_user_id) {
    const uid = parsed.data.supabase_user_id
    const { data: prof, error: profErr } = await admin
      .from("member_profiles")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle()
    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 400 })
    }
    if (!prof) {
      return NextResponse.json(
        { error: "No member_profiles row for this supabase_user_id. Create the member first." },
        { status: 422 },
      )
    }
    userId = uid
    resolutionSource = "body"
  }

  if (!userId) {
    const customerRef = subscription.customer
    const customerId = typeof customerRef === "string" ? customerRef : customerRef?.id ?? null
    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "Cannot resolve member: pass supabase_user_id in the JSON body, or ensure the Stripe subscription has a customer with an email that matches member_profiles.email.",
        },
        { status: 422 },
      )
    }

    let customer: Stripe.Customer
    try {
      const c = await stripe.customers.retrieve(customerId)
      if ("deleted" in c && c.deleted) {
        return NextResponse.json(
          { error: "Stripe customer is deleted; cannot match by email. Pass supabase_user_id in the body." },
          { status: 422 },
        )
      }
      customer = c as Stripe.Customer
    } catch {
      return NextResponse.json({ error: "Could not load Stripe customer for email match." }, { status: 422 })
    }

    const rawEmail = customer.email ?? ""
    const email = rawEmail.trim().toLowerCase()
    if (!email) {
      return NextResponse.json(
        {
          error:
            "Stripe customer has no email; cannot match to member_profiles. Pass supabase_user_id in the JSON body or add email on the Stripe customer.",
        },
        { status: 422 },
      )
    }

    const lookedUp = await lookupMemberUserIdByEmail(admin, email, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
    })
    if (lookedUp.kind === "none") {
      return NextResponse.json(
        {
          error: `No member_profiles row matches Stripe customer email (${email}). Pass supabase_user_id in the body or align emails.`,
        },
        { status: 422 },
      )
    }
    if (lookedUp.kind === "ambiguous") {
      return NextResponse.json(
        {
          error: `Multiple member_profiles rows match email (${email}). Pass supabase_user_id in the body to choose the member.`,
        },
        { status: 422 },
      )
    }
    if (lookedUp.kind === "db_error") {
      return NextResponse.json({ error: lookedUp.message }, { status: 500 })
    }
    userId = lookedUp.userId
    resolutionSource = "email"
  }

  if (!userId || !resolutionSource) {
    return NextResponse.json(
      {
        error:
          "Cannot resolve member: subscription has no supabase_user_id metadata, no billing_subscriptions row, no supabase_user_id in the request body, and customer email did not match a unique member.",
      },
      { status: 422 },
    )
  }

  await syncBillingFromSubscription(admin, subscription, userId, stripe)

  const shouldBackfillStripeMetadata = resolutionSource === "body" || resolutionSource === "email"
  let stripe_metadata_updated = false
  if (shouldBackfillStripeMetadata && subscription.metadata?.supabase_user_id !== userId) {
    const nextMeta: Record<string, string> = {}
    for (const [k, v] of Object.entries(subscription.metadata ?? {})) {
      if (typeof v === "string") nextMeta[k] = v
    }
    nextMeta.supabase_user_id = userId
    await stripe.subscriptions.update(subscription.id, { metadata: nextMeta })
    stripe_metadata_updated = true
  }

  await admin.from("audit_events").insert({
    actor_profile_id: session.profile.id,
    event_type: "billing_sync_subscription",
    entity_type: "billing_subscriptions",
    entity_id: subscription.id,
    payload: {
      stripe_subscription_id: subscription.id,
      user_id: userId,
      resolution_source: resolutionSource,
      stripe_metadata_updated,
    },
  })

  return NextResponse.json({
    ok: true,
    user_id: userId,
    resolution_source: resolutionSource,
    stripe_metadata_updated,
  })
}
