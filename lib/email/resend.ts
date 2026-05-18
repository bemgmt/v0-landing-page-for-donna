import "server-only"

type SendEmailParams = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  reply_to?: string
}

/**
 * Send an email using Resend API (HTTP POST Fetch - robust and zero-dependency).
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  reply_to,
}: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[Resend] Missing RESEND_API_KEY in environment.")
    throw new Error("Resend API key is not configured.")
  }

  const sender = from || process.env.RESEND_FROM_EMAIL || "DONNA <derek@aidonna.co>"
  const recipients = Array.isArray(to) ? to : [to]

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: sender,
      to: recipients,
      subject,
      html,
      reply_to,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[Resend] API Error: ${response.status} - ${errorText}`)
    throw new Error(`Resend failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data
}

type LayoutOptions = {
  title: string
  preheader?: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
}

/**
 * Generates a stunning, premium, brand-consistent glassmorphic HTML layout.
 * Reflects DONNA Brand Rules (navy background, glowing cyan/mint accents, crisp layout).
 */
export function getGlassmorphicLayout({
  title,
  preheader = "Operational Intelligence for Modern Business",
  bodyHtml,
  ctaText,
  ctaUrl,
}: LayoutOptions): string {
  const ctaSection = ctaText && ctaUrl
    ? `
    <div style="text-align: center; margin: 35px 0 25px 0;">
      <a href="${ctaUrl}" class="glow-button" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff 0%, #10b981 100%); color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4); transition: transform 0.2s ease;">
        ${ctaText}
      </a>
    </div>
    `
    : ""

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #020617;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .email-wrapper {
        width: 100%;
        background-color: #020617;
        padding: 40px 10px;
        box-sizing: border-box;
      }
      .glass-card {
        max-width: 600px;
        margin: 0 auto;
        background-color: #0b1329;
        border: 1px solid rgba(0, 212, 255, 0.15);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 212, 255, 0.05), 0 1px 3px rgba(0, 0, 0, 0.2);
      }
      .accent-header {
        height: 4px;
        background: linear-gradient(90deg, #8b5cf6 0%, #00d4ff 50%, #10b981 100%);
      }
      .brand-banner {
        padding: 30px 40px 15px 40px;
        text-align: left;
      }
      .brand-logo {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 0.18em;
        color: #00d4ff;
        text-transform: uppercase;
        margin: 0;
        display: inline-block;
      }
      .brand-tagline {
        font-size: 11px;
        letter-spacing: 0.12em;
        color: rgba(241, 245, 249, 0.4);
        text-transform: uppercase;
        margin-top: 5px;
        margin-bottom: 0;
      }
      .email-body {
        padding: 20px 40px 40px 40px;
      }
      .email-title {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #ffffff;
        margin-top: 0;
        margin-bottom: 24px;
        line-height: 1.25;
      }
      .text-paragraph {
        font-size: 15px;
        line-height: 1.6;
        color: rgba(241, 245, 249, 0.85);
        margin-top: 0;
        margin-bottom: 18px;
      }
      .data-table-card {
        background-color: rgba(21, 34, 68, 0.6);
        border: 1px solid rgba(0, 212, 255, 0.1);
        border-radius: 10px;
        padding: 20px;
        margin: 25px 0;
      }
      .data-row {
        padding: 8px 0;
        border-bottom: 1px solid rgba(241, 245, 249, 0.05);
      }
      .data-row:last-child {
        border-bottom: none;
      }
      .data-label {
        font-size: 12px;
        font-weight: 600;
        color: #00d4ff;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 2px 0;
      }
      .data-value {
        font-size: 15px;
        color: #f1f5f9;
        margin: 0;
      }
      .email-footer {
        max-width: 600px;
        margin: 0 auto;
        padding: 30px 20px 0 20px;
        text-align: center;
      }
      .footer-text {
        font-size: 12px;
        color: rgba(241, 245, 249, 0.4);
        line-height: 1.5;
        margin: 0 0 10px 0;
      }
      .footer-link {
        color: #00d4ff;
        text-decoration: none;
      }
      .footer-link:hover {
        text-decoration: underline;
      }
      a {
        color: #00d4ff;
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="glass-card">
        <div class="accent-header"></div>
        <div class="brand-banner">
          <div class="brand-logo">DONNA</div>
          <div class="brand-tagline">${preheader}</div>
        </div>
        <div class="email-body">
          <h1 class="email-title">${title}</h1>
          ${bodyHtml}
          ${ctaSection}
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">
          DONNA &bull; Operational Intelligence Layer for SMBs
        </p>
        <p class="footer-text">
          Have questions? Reply directly to this email or visit us at 
          <a href="https://aidonna.co" class="footer-link">aidonna.co</a>
        </p>
        <p class="footer-text" style="font-size: 11px; margin-top: 15px;">
          &copy; ${new Date().getFullYear()} DONNA. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
  `
}

/**
 * Sends a premium "Welcome to DONNA" confirmation email to a new paid subscriber.
 */
export async function sendUserSubscriptionWelcome({
  email,
  planLabel,
}: {
  email: string
  planLabel: string
}) {
  const portalUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidonna.co").replace(/\/$/, "") + "/portal"

  const html = getGlassmorphicLayout({
    title: "Welcome to DONNA Operational Infrastructure!",
    preheader: "Your Account is Now Active",
    bodyHtml: `
      <p class="text-paragraph">Your paid subscription to the <strong>${planLabel}</strong> tier has been successfully synchronized and activated!</p>
      <p class="text-paragraph">You now have immediate access to the full Operational Intelligence Layer. Leverage high-level automation, pipeline coordination, and structural AI monitoring designed to streamline your business workflows.</p>
      
      <div class="data-table-card">
        <p class="data-label">Active Plan</p>
        <p class="data-value" style="font-weight: bold; color: #00d4ff;">${planLabel}</p>
        <p class="data-label" style="margin-top: 10px;">Status</p>
        <p class="data-value" style="color: #10b981;">Active / Trialing</p>
      </div>

      <p class="text-paragraph">Log in to your dashboard to manage your operational pipelines, configure integrations, and invite team members to claim available seats.</p>
    `,
    ctaText: "Go to Portal Dashboard",
    ctaUrl: portalUrl,
  })

  return await sendEmail({
    to: email,
    subject: "Welcome to DONNA! Your Account is Active",
    html,
  })
}

/**
 * Sends a team invitation email to an invited teammate.
 */
export async function sendTeamSeatInvitation({
  inviteeEmail,
  purchaserEmail,
  planLabel,
}: {
  inviteeEmail: string
  purchaserEmail: string
  planLabel: string
}) {
  const loginUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidonna.co").replace(/\/$/, "") + "/login?next=/portal"

  const html = getGlassmorphicLayout({
    title: "You have been invited to join DONNA!",
    preheader: "Team Seat Invitation",
    bodyHtml: `
      <p class="text-paragraph">A teammate (<strong>${purchaserEmail}</strong>) has allocated an operational seat for you on their paid <strong>${planLabel}</strong> tier.</p>
      <p class="text-paragraph">By joining their organization, you will gain access to the shared DONNA operational workflow and intelligence tools, enabling you to coordinate projects, automate workflows, and collaborate seamlessly.</p>
      
      <div class="data-table-card">
        <p class="data-label">Invited by</p>
        <p class="data-value"><code>${purchaserEmail}</code></p>
        <p class="data-label" style="margin-top: 10px;">Team Plan</p>
        <p class="data-value" style="color: #00d4ff;">${planLabel}</p>
      </div>

      <p class="text-paragraph">Click below to accept your invitation, sign in to your existing account, or sign up with your email address (<strong>${inviteeEmail}</strong>) to immediately claim your seat.</p>
    `,
    ctaText: "Claim Your Team Seat",
    ctaUrl: loginUrl,
  })

  return await sendEmail({
    to: inviteeEmail,
    subject: `Invitation to join ${purchaserEmail}'s team on DONNA`,
    html,
  })
}

