import { NextResponse } from "next/server"
import { sendEmail, getGlassmorphicLayout } from "@/lib/email/resend"

export async function GET() {
  try {
    const hasApiKey = !!process.env.RESEND_API_KEY
    const sender = process.env.RESEND_FROM_EMAIL || "DONNA <derek@aidonna.co>"
    const recipient = process.env.CONTACT_EMAIL || "derek@bem.studio"

    if (!hasApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing RESEND_API_KEY in environment variables",
          config: {
            hasApiKey: false,
            sender,
            recipient,
          },
        },
        { status: 500 }
      )
    }

    const testHtml = getGlassmorphicLayout({
      title: "Resend Integration Verified!",
      preheader: "Transactional Email Diagnostics",
      bodyHtml: `
        <p class="text-paragraph">Congratulations! The transactional email engine has been successfully refactored and is now operating on **Resend**.</p>
        <p class="text-paragraph">This diagnostic email confirms that your API credentials, network path, and the custom premium **liquid-glass branding design template** are fully functional.</p>
        
        <div class="data-table-card">
          <div class="data-row">
            <p class="data-label">Diagnostic Status</p>
            <p class="data-value" style="color: #10b981; font-weight: bold;">PASSED</p>
          </div>
          <div class="data-row">
            <p class="data-label">Sender Address</p>
            <p class="data-value"><code>${sender}</code></p>
          </div>
          <div class="data-row">
            <p class="data-label">Recipient Address</p>
            <p class="data-value"><code>${recipient}</code></p>
          </div>
          <div class="data-row">
            <p class="data-label">Timestamp</p>
            <p class="data-value">${new Date().toLocaleString()}</p>
          </div>
        </div>
        
        <p class="text-paragraph">All standard waitlist requests, demo coordination alerts, portal teammate invites, and subscriber welcomes will now use this highly aesthetic branding.</p>
      `,
      ctaText: "Open Resend Dashboard",
      ctaUrl: "https://resend.com/emails"
    })

    console.log("[test-email] Sending diagnostic test email via Resend to:", recipient)
    const result = await sendEmail({
      to: recipient,
      subject: "DONNA Resend Integration Verified",
      html: testHtml,
    })

    return NextResponse.json({
      success: true,
      message: "Resend integration verified and diagnostic email sent successfully!",
      result,
      config: {
        hasApiKey: true,
        sender,
        recipient,
      },
    })
  } catch (error) {
    console.error("[test-email] Diagnostic error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    )
  }
}
