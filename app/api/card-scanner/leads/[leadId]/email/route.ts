import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendCardScanAlert } from "@/lib/email/send-card-scan-alert"
import { WORKFLOW_NOTIFICATION_RECIPIENT } from "@/lib/email/workflow-alert-content"

type RouteContext = { params: Promise<{ leadId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { leadId } = await context.params
  if (!z.string().uuid().safeParse(leadId).success) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 })
  }

  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: lead, error: leadErr } = await admin
    .from("business_card_leads")
    .select("id, full_name, company, job_title, primary_email, phone, website, event_tag, notes")
    .eq("id", leadId)
    .maybeSingle()

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const sent = await sendCardScanAlert({
    leadId: lead.id,
    fullName: lead.full_name,
    company: lead.company,
    jobTitle: lead.job_title,
    email: lead.primary_email,
    phone: lead.phone,
    website: lead.website,
    eventOrLocation: lead.event_tag,
    notes: lead.notes,
  })

  if (!sent) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }

  console.info(
    "[card-scanner email]",
    JSON.stringify({
      leadId,
      recipientEmail: WORKFLOW_NOTIFICATION_RECIPIENT,
      phase: "sent",
    }),
  )

  return NextResponse.json({
    success: true,
    sent_to: WORKFLOW_NOTIFICATION_RECIPIENT,
  })
}
