import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail, getGlassmorphicLayout } from "@/lib/email/resend"

const emailBodySchema = z.object({
  recipient_email: z.string().email().optional(),
})

type RouteContext = { params: Promise<{ leadId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { leadId } = await context.params
  if (!z.string().uuid().safeParse(leadId).success) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 })
  }

  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("id, role, email")
    .eq("user_id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  // Parse body
  let recipientEmail: string
  try {
    const json = await request.json()
    const parsed = emailBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    recipientEmail =
      parsed.data.recipient_email ||
      process.env.CARD_SCAN_DEFAULT_EMAIL ||
      "derek@aidonna.co"
  } catch {
    recipientEmail =
      process.env.CARD_SCAN_DEFAULT_EMAIL || "derek@aidonna.co"
  }

  // Fetch the lead
  const admin = createAdminClient()
  const { data: lead, error: leadErr } = await admin
    .from("business_card_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle()

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  // Build and send the email
  const html = getGlassmorphicLayout({
    title: "New Card Lead Scanned",
    preheader: "Business Card Lead — CRM Import",
    bodyHtml: `
      <p class="text-paragraph">A new business card has been scanned and is ready for CRM import.</p>
      <div class="data-table-card">
        <div class="data-row">
          <p class="data-label">Full Name</p>
          <p class="data-value">${lead.full_name || "—"}</p>
        </div>
        <div class="data-row">
          <p class="data-label">Company</p>
          <p class="data-value">${lead.company || "—"}</p>
        </div>
        <div class="data-row">
          <p class="data-label">Email</p>
          <p class="data-value">${lead.primary_email || "—"}</p>
        </div>
        <div class="data-row">
          <p class="data-label">Phone</p>
          <p class="data-value">${lead.phone || "—"}</p>
        </div>
        <div class="data-row">
          <p class="data-label">Event</p>
          <p class="data-value">${lead.event_tag || "—"}</p>
        </div>
      </div>
    `,
  })

  try {
    await sendEmail({
      to: recipientEmail,
      subject: "New Card Lead Scanned",
      html,
    })

    console.info(
      "[card-scanner email]",
      JSON.stringify({
        leadId,
        recipientEmail,
        phase: "sent",
      })
    )

    return NextResponse.json({ success: true, sent_to: recipientEmail })
  } catch (e) {
    console.error("[card-scanner email]", e)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
