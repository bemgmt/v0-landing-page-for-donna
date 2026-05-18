import "server-only"
import { sendEmail, getGlassmorphicLayout } from "@/lib/email/resend"

export type OpsSubscriptionAlertPayload = {
  supabaseUserId: string
  memberEmail: string | null
  planLabel: string
  stripeSubscriptionId: string
  stripeCustomerId: string | null
  subscriptionStatus: string
}

/**
 * Internal ops email when a subscription syncs to active/trialing (using Resend).
 * Returns false if Resend is not configured or send failed (caller should log).
 */
export async function sendOpsSubscriptionAlert(payload: OpsSubscriptionAlertPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[ops-subscription-alert] Resend API key not configured (RESEND_API_KEY)")
    return false
  }

  const to = (process.env.CONTACT_EMAIL || "derek@bem.studio").trim()
  const dashboardBase =
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") === true
      ? "https://dashboard.stripe.com"
      : "https://dashboard.stripe.com/test"
  const subUrl = `${dashboardBase}/subscriptions/${payload.stripeSubscriptionId}`

  const subject = `DONNA subscription — ${payload.planLabel} (${payload.stripeSubscriptionId})`

  const html = getGlassmorphicLayout({
    title: "New Subscription Synced",
    preheader: "Operations Alert",
    bodyHtml: `
      <p class="text-paragraph">A subscriber's paid billing status has been updated in Stripe and successfully synchronized with the database.</p>
      <div class="data-table-card">
        <div class="data-row">
          <p class="data-label">Supabase User ID</p>
          <p class="data-value"><code>${payload.supabaseUserId}</code></p>
        </div>
        <div class="data-row">
          <p class="data-label">Member Email</p>
          <p class="data-value">${payload.memberEmail ?? "—"}</p>
        </div>
        <div class="data-row">
          <p class="data-label">Plan Tier</p>
          <p class="data-value">${payload.planLabel}</p>
        </div>
        <div class="data-row">
          <p class="data-label">Stripe Subscription ID</p>
          <p class="data-value"><code>${payload.stripeSubscriptionId}</code></p>
        </div>
        <div class="data-row">
          <p class="data-label">Stripe Customer ID</p>
          <p class="data-value"><code>${payload.stripeCustomerId ?? "—"}</code></p>
        </div>
        <div class="data-row">
          <p class="data-label">Status</p>
          <p class="data-value" style="color: #10b981; font-weight: bold;">${payload.subscriptionStatus.toUpperCase()}</p>
        </div>
      </div>
      <p class="text-paragraph" style="text-align: center; margin-top: 20px;">
        <a href="${subUrl}" style="color: #00d4ff; text-decoration: underline; font-weight: bold;">Open in Stripe Dashboard &rarr;</a>
      </p>
    `
  })

  try {
    await sendEmail({
      to,
      subject,
      html,
      reply_to: payload.memberEmail || undefined,
    })
    return true
  } catch (e) {
    console.error("[ops-subscription-alert] Resend send failed", e)
    return false
  }
}
