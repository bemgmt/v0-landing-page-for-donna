import "server-only"

import nodemailer from "nodemailer"

export type OpsSubscriptionAlertPayload = {
  supabaseUserId: string
  memberEmail: string | null
  planLabel: string
  stripeSubscriptionId: string
  stripeCustomerId: string | null
  subscriptionStatus: string
}

function normalizeSmtpHost(raw: string): string {
  let host = raw.trim().toLowerCase()
  if (host === "stmp.gmail.com") host = "smtp.gmail.com"
  return host
}

/**
 * Internal ops email when a subscription syncs to active/trialing (SMTP_* + CONTACT_EMAIL).
 * Returns false if SMTP is not configured or send failed (caller should log).
 */
export async function sendOpsSubscriptionAlert(payload: OpsSubscriptionAlertPayload): Promise<boolean> {
  const hostRaw = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD
  if (!hostRaw || !user || !pass) {
    console.error("[ops-subscription-alert] SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASSWORD)")
    return false
  }

  const smtpHost = normalizeSmtpHost(hostRaw)
  if (smtpHost.length < 3) {
    console.error("[ops-subscription-alert] Invalid SMTP_HOST")
    return false
  }

  const port = parseInt(process.env.SMTP_PORT || "465", 10)
  const to = (process.env.CONTACT_EMAIL || "derek@bem.studio").trim()
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const dashboardBase =
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") === true
      ? "https://dashboard.stripe.com"
      : "https://dashboard.stripe.com/test"
  const subUrl = `${dashboardBase}/subscriptions/${payload.stripeSubscriptionId}`

  const subject = `DONNA subscription — ${payload.planLabel} (${payload.stripeSubscriptionId})`
  const html = `
    <h2>New subscription synced</h2>
    <p><strong>Supabase user id:</strong> ${payload.supabaseUserId}</p>
    <p><strong>Member email:</strong> ${payload.memberEmail ?? "—"}</p>
    <p><strong>Plan:</strong> ${payload.planLabel}</p>
    <p><strong>Stripe subscription id:</strong> ${payload.stripeSubscriptionId}</p>
    <p><strong>Stripe customer id:</strong> ${payload.stripeCustomerId ?? "—"}</p>
    <p><strong>Status:</strong> ${payload.subscriptionStatus}</p>
    <p><a href="${subUrl}">Open in Stripe Dashboard</a></p>
    <p><em>Sent ${new Date().toISOString()}</em></p>
  `

  try {
    await transporter.sendMail({
      from: user,
      to,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error("[ops-subscription-alert] send failed", e)
    return false
  }
}
