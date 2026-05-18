import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, getGlassmorphicLayout } from "@/lib/email/resend"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, role, useCase, type } = body

    // Validate required fields
    if (!name || !email || !company || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("[send-email] RESEND_API_KEY not configured")
      return NextResponse.json(
        { error: "Email service not configured. Please contact support." },
        { status: 500 }
      )
    }

    const notificationRecipient = process.env.CONTACT_EMAIL || "derek@bem.studio"
    const isEarlyAdopterDiscovery = type === "discovery" || type === "waitlist"
    const leadLabel =
      type === "discovery" || type === "waitlist"
        ? "Early adopter interest — discovery call"
        : type === "demo"
          ? "Demo request"
          : "Lead"

    // 1. Build Notification Email to internal team (Derek)
    const notificationHtml = getGlassmorphicLayout({
      title: `New Lead: ${leadLabel}`,
      preheader: "Internal Lead Alert",
      bodyHtml: `
        <p class="text-paragraph">A new request has been submitted from the landing page. Here are the submission details:</p>
        <div class="data-table-card">
          <div class="data-row">
            <p class="data-label">Name</p>
            <p class="data-value">${name}</p>
          </div>
          <div class="data-row">
            <p class="data-label">Email</p>
            <p class="data-value">${email}</p>
          </div>
          <div class="data-row">
            <p class="data-label">Company</p>
            <p class="data-value">${company}</p>
          </div>
          <div class="data-row">
            <p class="data-label">Role</p>
            <p class="data-value">${role}</p>
          </div>
          <div class="data-row">
            <p class="data-label">Use Case</p>
            <p class="data-value">${useCase || "Not provided"}</p>
          </div>
          <div class="data-row">
            <p class="data-label">Submitted at</p>
            <p class="data-value">${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    })

    console.log("[send-email] Sending notification email via Resend to:", notificationRecipient)
    try {
      await sendEmail({
        to: notificationRecipient,
        subject: `DONNA ${leadLabel} — ${name}`,
        html: notificationHtml,
        reply_to: email, // Directly reply to the user who signed up!
      })
      console.log("[send-email] Notification email sent successfully")
    } catch (sendError) {
      console.error("[send-email] Failed to send notification email:", sendError)
      return NextResponse.json(
        { error: "Failed to dispatch lead notification. Please try again." },
        { status: 500 }
      )
    }

    // 2. Build and send confirmation email to the user
    const autoReplyText = isEarlyAdopterDiscovery
      ? "We've received your interest and will reach out to schedule a short discovery call with a DONNA representative. Our team will be in touch within 24 hours."
      : type === "demo"
        ? "We've received your demo request. One of our operational specialists will reach out to you within 24 hours to coordinate a walkthrough."
        : "We've received your request. Our operations team will be in touch within 24 hours."

    const confirmationHtml = getGlassmorphicLayout({
      title: `Welcome to the future of SMB operations, ${name}!`,
      preheader: "We Received Your Request",
      bodyHtml: `
        <p class="text-paragraph">Thank you for reaching out to DONNA. We are thrilled to partner with you in streamlining your business systems and establishing a premium, scalable operational infrastructure.</p>
        <p class="text-paragraph"><strong>Here is what happens next:</strong></p>
        <p class="text-paragraph">${autoReplyText}</p>
        <p class="text-paragraph">In the meantime, you can explore more about our core philosophy and operational capabilities online.</p>
      `,
      ctaText: "Explore aidonna.co",
      ctaUrl: "https://aidonna.co"
    })

    console.log("[send-email] Sending auto-reply confirmation email via Resend to:", email)
    try {
      await sendEmail({
        to: email,
        subject: "DONNA - We Received Your Request",
        html: confirmationHtml,
      })
      console.log("[send-email] User confirmation email sent successfully")
    } catch (sendError) {
      console.error("[send-email] Failed to send user confirmation email:", sendError)
      // Don't fail the whole request if only the user's confirmation email fails
    }

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("[send-email] General route error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 })
  }
}
