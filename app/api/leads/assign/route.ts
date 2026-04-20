import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"

const bodySchema = z.object({
  lead_id: z.string().uuid(),
  queue_name: z.string().default("default"),
})

export async function POST(request: Request) {
  const session = await requireStaffOrAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: lead, error: leadErr } = await admin
    .from("lead_pool")
    .select("id, status")
    .eq("id", parsed.data.lead_id)
    .maybeSingle()

  if (leadErr || !lead || lead.status !== "unclaimed") {
    return NextResponse.json({ error: "Lead not available" }, { status: 400 })
  }

  const { data: partners, error: pErr } = await admin
    .from("member_profiles")
    .select("id")
    .eq("role", "partner")
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  if (pErr || !partners?.length) {
    return NextResponse.json({ error: "No active partners in queue" }, { status: 400 })
  }

  const { data: rr } = await admin
    .from("round_robin_state")
    .select("*")
    .eq("queue_name", parsed.data.queue_name)
    .maybeSingle()

  const idx = rr?.current_index ?? 0
  const pick = partners[idx % partners.length]!

  const nextIndex = (idx + 1) % partners.length

  await admin
    .from("round_robin_state")
    .upsert(
      {
        queue_name: parsed.data.queue_name,
        current_partner_id: pick.id,
        current_index: nextIndex,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "queue_name" },
    )

  await admin
    .from("lead_pool")
    .update({
      status: "assigned",
      assigned_partner_id: pick.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.lead_id)

  await admin.from("audit_events").insert({
    actor_profile_id: session.profile.id,
    event_type: "lead_round_robin_assign",
    entity_type: "lead_pool",
    entity_id: parsed.data.lead_id,
    payload: { partner_id: pick.id, queue: parsed.data.queue_name },
  })

  return NextResponse.json({ ok: true, assigned_partner_id: pick.id })
}
