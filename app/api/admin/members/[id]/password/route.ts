import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  new_password: z.string().min(8).max(128),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: profileId } = await params
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from("member_profiles")
    .select("id, user_id")
    .eq("id", profileId)
    .maybeSingle()

  if (profileError || !profile?.user_id) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 })
  }

  const { error: authError } = await admin.auth.admin.updateUserById(profile.user_id, {
    password: parsed.data.new_password,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  await admin.from("audit_events").insert({
    actor_profile_id: session.profile.id,
    event_type: "password_reset_by_admin",
    entity_type: "member_profiles",
    entity_id: profileId,
    payload: { target_user_id: profile.user_id },
  })

  return NextResponse.json({ ok: true })
}
