import "server-only"

import Stripe from "stripe"
import { sendOpsSubscriptionAlert } from "@/lib/email/send-ops-subscription-alert"
import { sendUserSubscriptionWelcome } from "@/lib/email/resend"
import { planDisplayLabel, primaryPlanKey } from "@/lib/billing/plan-seats"
import { createAdminClient } from "@/lib/supabase/admin"

export type AdminClient = ReturnType<typeof createAdminClient>

export function parseNotificationEmails(customer: Stripe.Customer): string[] {
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

export async function syncSubscriptionItems(
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

export async function syncBillingFromSubscription(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  userId: string,
  stripe: Stripe,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null

  const customer = customerId ? await stripe.customers.retrieve(customerId) : null

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

  await maybeSendOpsSubscriptionNotify(admin, subscription, userId)
}

function planKeyFromStripeSubscription(subscription: Stripe.Subscription): string {
  const sortedItems = [...subscription.items.data].sort((a, b) => a.id.localeCompare(b.id))
  const items = sortedItems.map((item) => {
    const { stripe_price_id, price_lookup_key } = priceFieldsFromItem(item)
    return { stripe_price_id, price_lookup_key }
  })
  const primary = primarySubscriptionItem(sortedItems)
  const primaryFields = primary ? priceFieldsFromItem(primary) : { stripe_price_id: null, price_lookup_key: null }
  return primaryPlanKey({
    price_lookup_key: primaryFields.price_lookup_key,
    stripe_price_id: primaryFields.stripe_price_id,
    items,
  })
}

async function maybeSendOpsSubscriptionNotify(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  userId: string,
): Promise<void> {
  const status = subscription.status
  if (status !== "active" && status !== "trialing") return

  const { data: claimed, error: claimError } = await admin
    .from("billing_subscriptions")
    .update({
      ops_subscribe_notified_at: new Date().toISOString(),
      ops_subscribe_notified_stripe_subscription_id: subscription.id,
    })
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .or(
      `ops_subscribe_notified_stripe_subscription_id.is.null,ops_subscribe_notified_stripe_subscription_id.neq.${subscription.id}`,
    )
    .select("id")
    .maybeSingle()

  if (claimError) {
    console.error("[stripe-sync] ops subscription notify claim failed", claimError.message)
    return
  }
  if (!claimed) return

  const { data: profile, error: profileError } = await admin
    .from("member_profiles")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("[stripe-sync] member_profiles read for ops notify failed", profileError.message)
  }

  const planKey = planKeyFromStripeSubscription(subscription)
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null

  const sent = await sendOpsSubscriptionAlert({
    supabaseUserId: userId,
    memberEmail: profile?.email ? String(profile.email).trim() || null : null,
    planLabel: planDisplayLabel(planKey),
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    subscriptionStatus: status,
  })

  if (sent) {
    if (profile?.email) {
      const subEmail = String(profile.email).trim()
      if (subEmail) {
        try {
          console.log("[stripe-sync] Dispatching welcome email to subscriber:", subEmail)
          await sendUserSubscriptionWelcome({
            email: subEmail,
            planLabel: planDisplayLabel(planKey),
          })
          console.log("[stripe-sync] Welcome email sent successfully")
        } catch (welcomeErr) {
          console.error("[stripe-sync] Failed to send subscriber welcome email:", welcomeErr)
        }
      }
    }
  } else {
    const { error: revertError } = await admin
      .from("billing_subscriptions")
      .update({
        ops_subscribe_notified_at: null,
        ops_subscribe_notified_stripe_subscription_id: null,
      })
      .eq("user_id", userId)
      .eq("ops_subscribe_notified_stripe_subscription_id", subscription.id)

    if (revertError) {
      console.error("[stripe-sync] ops notify revert after failed send failed", revertError.message)
    }
  }
}

export type MemberEmailLookupResult =
  | { kind: "found"; userId: string }
  | { kind: "none" }
  | { kind: "ambiguous"; count: number }
  | { kind: "db_error"; message: string }

/**
 * Match Stripe checkout / customer email to a single member_profiles.user_id (case-insensitive).
 */
export async function lookupMemberUserIdByEmail(
  admin: AdminClient,
  email: string,
  logContext?: Record<string, unknown>,
): Promise<MemberEmailLookupResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { kind: "none" }

  const { data: profiles, error } = await admin
    .from("member_profiles")
    .select("id, user_id, email")
    .ilike("email", normalized)

  if (error) {
    console.error("[stripe-sync] member_profiles lookup by email failed", error.message, logContext)
    return { kind: "db_error", message: error.message }
  }
  if (!profiles?.length) return { kind: "none" }
  if (profiles.length > 1) {
    const exact = profiles.filter((p) => (p.email ?? "").trim().toLowerCase() === normalized)
    if (exact.length === 1) return { kind: "found", userId: exact[0].user_id }
    console.warn("[stripe-sync] ambiguous member_profiles for email", {
      ...logContext,
      email: normalized,
      count: profiles.length,
    })
    return { kind: "ambiguous", count: profiles.length }
  }
  return { kind: "found", userId: profiles[0].user_id }
}

/**
 * Resolve Supabase auth user id for a Checkout session: explicit ids first, then checkout email → member_profiles.
 */
export async function resolveUserIdForCheckoutSession(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const fromExplicit =
    session.client_reference_id ??
    (typeof session.metadata?.supabase_user_id === "string" ? session.metadata.supabase_user_id : null)
  if (fromExplicit) return fromExplicit

  const rawEmail =
    session.customer_details?.email ??
    (typeof session.customer_email === "string" ? session.customer_email : null)
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
  if (!email) return null

  const lookedUp = await lookupMemberUserIdByEmail(admin, email, { sessionId: session.id })
  if (lookedUp.kind === "found") return lookedUp.userId
  return null
}

export async function syncFromCheckoutSession(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  stripe: Stripe,
): Promise<void> {
  const userId = await resolveUserIdForCheckoutSession(admin, session)
  if (!userId) {
    console.warn("[stripe-sync] checkout.session.completed: could not resolve user_id", {
      sessionId: session.id,
    })
    return
  }

  const subRef = session.subscription
  const subId = typeof subRef === "string" ? subRef : subRef?.id
  if (!subId) return

  const subscription = await stripe.subscriptions.retrieve(subId, {
    expand: ["items.data.price"],
  })

  await syncBillingFromSubscription(admin, subscription, userId, stripe)
}

export async function syncSubscriptionWebhook(
  admin: AdminClient,
  sub: Stripe.Subscription,
  stripe: Stripe,
): Promise<void> {
  let userId = typeof sub.metadata?.supabase_user_id === "string" ? sub.metadata.supabase_user_id : null

  if (!userId) {
    const { data } = await admin
      .from("billing_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle()
    userId = data?.user_id ?? null
  }

  if (!userId) {
    const customerRef = sub.customer
    const customerId = typeof customerRef === "string" ? customerRef : customerRef?.id ?? null
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId)
      if (!("deleted" in customer && customer.deleted)) {
        const c = customer as Stripe.Customer
        const email = (c.email ?? "").trim()
        if (email) {
          const lookedUp = await lookupMemberUserIdByEmail(admin, email, {
            stripeSubscriptionId: sub.id,
            stripeCustomerId: customerId,
          })
          if (lookedUp.kind === "found") {
            userId = lookedUp.userId
          } else if (lookedUp.kind === "ambiguous") {
            console.warn("[stripe-sync] subscription webhook: ambiguous member_profiles for customer email", {
              stripeSubscriptionId: sub.id,
              stripeCustomerId: customerId,
              count: lookedUp.count,
            })
          }
        }
      }
    }
  }

  if (!userId) {
    console.warn("[stripe-sync] subscription webhook: could not resolve user_id", {
      stripeSubscriptionId: sub.id,
    })
    return
  }

  const subscription = await stripe.subscriptions.retrieve(sub.id, {
    expand: ["items.data.price"],
  })

  await syncBillingFromSubscription(admin, subscription, userId, stripe)
}

export async function syncCustomerRecord(admin: AdminClient, customer: Stripe.Customer) {
  if ("deleted" in customer && customer.deleted) return

  const customerId = customer.id
  const email = (customer.email ?? "").trim()
  if (!email) return

  await admin.from("billing_customers").upsert(
    {
      stripe_customer_id: customerId,
      email,
    },
    { onConflict: "stripe_customer_id" },
  )

  const notificationEmails = parseNotificationEmails(customer)
  const { error } = await admin
    .from("billing_subscriptions")
    .update({ notification_emails: notificationEmails })
    .eq("stripe_customer_id", customerId)

  if (error) throw error
}

export async function autoSyncUserSubscription(
  admin: AdminClient,
  userId: string,
  email: string,
): Promise<boolean> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey?.trim()) return false

  const stripe = new Stripe(secretKey)
  try {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return false

    // 1. Search for customer by email
    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 5,
    })

    if (customers.data.length === 0) {
      // No stripe customer found for this email. Create inactive subscription row to avoid re-checking.
      await admin.from("billing_subscriptions").upsert(
        {
          user_id: userId,
          status: "inactive",
        },
        { onConflict: "user_id" }
      )
      return false
    }

    // 2. Look for active or trialing subscriptions for these customers
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 5,
        expand: ["data.items.data.price"],
      })

      let subList = subscriptions.data
      if (subList.length === 0) {
        const trialing = await stripe.subscriptions.list({
          customer: customer.id,
          status: "trialing",
          limit: 5,
          expand: ["data.items.data.price"],
        })
        subList = trialing.data
      }

      if (subList.length > 0) {
        // Found an active/trialing subscription! Let's sync it.
        const subscription = subList[0]
        await syncBillingFromSubscription(admin, subscription, userId, stripe)

        // Also update Stripe subscription metadata with the supabase user id
        if (subscription.metadata?.supabase_user_id !== userId) {
          const nextMeta: Record<string, string> = {}
          for (const [k, v] of Object.entries(subscription.metadata ?? {})) {
            if (typeof v === "string") nextMeta[k] = v
          }
          nextMeta.supabase_user_id = userId
          await stripe.subscriptions.update(subscription.id, { metadata: nextMeta })
        }
        return true
      }
    }

    // If we have customer(s) but no active/trialing subscription, insert inactive row
    await admin.from("billing_subscriptions").upsert(
      {
        user_id: userId,
        status: "inactive",
        stripe_customer_id: customers.data[0].id,
      },
      { onConflict: "user_id" }
    )
    return false
  } catch (err) {
    console.error("[stripe-sync] autoSyncUserSubscription failed:", err)
    return false
  }
}
