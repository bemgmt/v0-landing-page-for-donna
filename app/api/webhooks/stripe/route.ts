import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

type AdminClient = ReturnType<typeof createAdminClient>

function parseNotificationEmails(customer: Stripe.Customer): string[] {
  const raw = customer.metadata?.donna_notification_emails
  if (!raw || typeof raw !== "string") return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed as string[]
    }
  } catch {
    /* ignore invalid JSON */
  }
  return []
}

function primarySubscriptionItem(
  items: Stripe.SubscriptionItem[],
): Stripe.SubscriptionItem | undefined {
  return [...items].sort((a, b) => a.id.localeCompare(b.id))[0]
}

function priceFieldsFromItem(item: Stripe.SubscriptionItem): {
  stripe_price_id: string | null
  price_lookup_key: string | null
} {
  const price = item.price
  if (!price || typeof price === "string") {
    return { stripe_price_id: typeof price === "string" ? price : null, price_lookup_key: null }
  }
  return {
    stripe_price_id: price.id ?? null,
    price_lookup_key: price.lookup_key ?? null,
  }
}

async function upsertBillingCustomer(
  admin: AdminClient,
  stripeCustomerId: string,
  customer: Stripe.Customer,
) {
  const email = (customer.email ?? "").trim()
  if (!email) return
  await admin.from("billing_customers").upsert(
    {
      stripe_customer_id: stripeCustomerId,
      email,
    },
    { onConflict: "stripe_customer_id" },
  )
}

async function syncSubscriptionItems(
  admin: AdminClient,
  subscription: Stripe.Subscription,
) {
  const subId = subscription.id
  await admin.from("billing_subscription_items").delete().eq("stripe_subscription_id", subId)

  const rows = subscription.items.data.map((item) => {
    const { stripe_price_id, price_lookup_key } = priceFieldsFromItem(item)
    return {
      stripe_subscription_id: subId,
      stripe_subscription_item_id: item.id,
      quantity: item.quantity ?? 1,
      stripe_price_id,
      price_lookup_key,
    }
  })

  if (rows.length > 0) {
    const { error } = await admin.from("billing_subscription_items").insert(rows)
    if (error) throw error
  }
}

async function syncBillingFromSubscription(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  userId: string,
  stripe: Stripe,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null

  const customer = customerId
    ? await stripe.customers.retrieve(customerId)
    : null

  if (customer && !("deleted" in customer && customer.deleted)) {
    await upsertBillingCustomer(admin, customerId!, customer as Stripe.Customer)
  }

  const notificationEmails =
    customer && !("deleted" in customer && customer.deleted)
      ? parseNotificationEmails(customer as Stripe.Customer)
      : []

  const primary = primarySubscriptionItem(subscription.items.data)
  const primaryPrice = primary ? priceFieldsFromItem(primary) : { stripe_price_id: null, price_lookup_key: null }

  await admin.from("billing_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      stripe_price_id: primaryPrice.stripe_price_id,
      price_lookup_key: primaryPrice.price_lookup_key,
      notification_emails: notificationEmails,
    },
    { onConflict: "user_id" },
  )

  await syncSubscriptionItems(admin, subscription)
}

async function syncFromCheckout(session: Stripe.Checkout.Session, stripe: Stripe) {
  const admin = createAdminClient()
  const userId =
    session.client_reference_id ??
    (typeof session.metadata?.supabase_user_id === "string" ? session.metadata.supabase_user_id : null)
  if (!userId) return

  const subRef = session.subscription
  const subId = typeof subRef === "string" ? subRef : subRef?.id
  if (!subId) return

  const subscription = await stripe.subscriptions.retrieve(subId, {
    expand: ["items.data.price"],
  })

  await syncBillingFromSubscription(admin, subscription, userId, stripe)
}

async function syncSubscription(sub: Stripe.Subscription, stripe: Stripe) {
  const admin = createAdminClient()
  let userId =
    typeof sub.metadata?.supabase_user_id === "string" ? sub.metadata.supabase_user_id : null

  if (!userId) {
    const { data } = await admin
      .from("billing_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle()
    userId = data?.user_id ?? null
  }

  if (!userId) return

  const subscription = await stripe.subscriptions.retrieve(sub.id, {
    expand: ["items.data.price"],
  })

  await syncBillingFromSubscription(admin, subscription, userId, stripe)
}

async function syncCustomerRecord(customer: Stripe.Customer) {
  if ("deleted" in customer && customer.deleted) return

  const admin = createAdminClient()
  const customerId = customer.id
  const email = (customer.email ?? "").trim()
  if (!email) return

  await upsertBillingCustomer(admin, customerId, customer)

  const notificationEmails = parseNotificationEmails(customer)
  const { error } = await admin
    .from("billing_subscriptions")
    .update({ notification_emails: notificationEmails })
    .eq("stripe_customer_id", customerId)

  if (error) throw error
}

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncFromCheckout(event.data.object as Stripe.Checkout.Session, stripe)
        break
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription, stripe)
        break
      case "customer.updated":
      case "customer.created":
        await syncCustomerRecord(event.data.object as Stripe.Customer)
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
