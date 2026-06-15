import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const postBodySchema = z.object({
  to_profile_ids: z.array(z.string().uuid()).min(1).max(50),
  note: z.string().max(2000).optional().nullable(),
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
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile || !["admin", "staff", "partner"].includes(profile.role)) {
    return NextResponse.json(
      { error: "Partner, staff, or admin access required" },
      { status: 403 }
    )
  }

  // Parse body
  let body: z.infer<typeof postBodySchema>
  try {
    const json = await request.json()
    const parsed = postBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const noteTrimmed = body.note?.trim() ?? ""
  const note = noteTrimmed.length > 0 ? noteTrimmed : null

  // Verify the lead exists and the user has access
  const admin = createAdminClient()
  const { data: lead, error: leadErr } = await admin
    .from("business_card_leads")
    .select("id, scanned_by")
    .eq("id", leadId)
    .maybeSingle()

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const isAdmin = profile.role === "admin"
  if (!isAdmin && lead.scanned_by !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Filter recipients: only active partner/staff/admin, excluding self
  const uniqueRecipients = [...new Set(body.to_profile_ids)].filter(
    (id) => id !== profile.id
  )
  if (uniqueRecipients.length === 0) {
    return NextResponse.json({ error: "No valid recipients" }, { status: 400 })
  }

  const { data: recipients, error: recErr } = await admin
    .from("member_profiles")
    .select("id")
    .in("id", uniqueRecipients)
    .in("role", ["partner", "staff", "admin"])
    .eq("is_active", true)

  if (recErr) {
    return NextResponse.json(
      { error: "Failed to validate recipients" },
      { status: 500 }
    )
  }

  const validIds = new Set((recipients ?? []).map((r) => r.id))
  const toInsert = uniqueRecipients
    .filter((id) => validIds.has(id))
    .map((to_profile_id) => ({
      lead_id: leadId,
      from_profile_id: profile.id,
      to_profile_id,
      note,
    }))

  if (toInsert.length === 0) {
    return NextResponse.json(
      { error: "No active partner/staff/admin members in recipient list" },
      { status: 400 }
    )
  }

  // Insert shares, skipping duplicates
  let created = 0
  let skippedDuplicate = 0
  for (const row of toInsert) {
    const { error: insErr } = await admin
      .from("business_card_shares")
      .insert(row)
    if (insErr) {
      if (insErr.code === "23505") {
        skippedDuplicate++
        continue
      }
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
    created++
  }

  return NextResponse.json({
    success: true,
    created,
    skipped_duplicate: skippedDuplicate,
  })
}
