import { NextResponse } from "next/server"
import { z } from "zod"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"

const bodySchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(12000),
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

  const { data: chatSession, error } = await session.supabase
    .from("chat_sessions")
    .select("id, status, staff_profile_id")
    .eq("id", parsed.data.session_id)
    .maybeSingle()

  if (error || !chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  if (chatSession.status !== "live" || chatSession.staff_profile_id !== session.profile.id) {
    return NextResponse.json({ error: "Not assigned to this session" }, { status: 403 })
  }

  const { error: insErr } = await session.supabase.from("chat_messages").insert({
    session_id: parsed.data.session_id,
    role: "staff",
    message: parsed.data.message,
    metadata: {},
  })

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
