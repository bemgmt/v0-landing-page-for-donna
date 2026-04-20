import { NextResponse } from "next/server"
import { z } from "zod"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"

const bodySchema = z.object({
  session_id: z.string().uuid(),
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

  const { error } = await session.supabase
    .from("chat_sessions")
    .update({
      status: "live",
      staff_profile_id: session.profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.session_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await session.supabase.from("chat_messages").insert({
    session_id: parsed.data.session_id,
    role: "system",
    message: "A staff member joined the conversation.",
    metadata: {},
  })

  return NextResponse.json({ ok: true })
}
