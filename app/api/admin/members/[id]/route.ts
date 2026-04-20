import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"
import { isRole, type MemberRole } from "@/lib/auth/roles"

const patchSchema = z.object({
  role: z.enum(["free_member", "partner", "staff", "admin"]),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaffOrAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (session.profile.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const { id } = await params
  const json = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const role = parsed.data.role as MemberRole
  if (!isRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("member_profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, role")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await admin.from("audit_events").insert({
    actor_profile_id: session.profile.id,
    event_type: "role_change",
    entity_type: "member_profiles",
    entity_id: id,
    payload: { new_role: role },
  })

  return NextResponse.json({ profile: data })
}
