import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"

const bodySchema = z.object({
  session_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { supabase, profile } = session

  const { data: chatSession, error: se } = await supabase
    .from("chat_sessions")
    .select("id, member_profile_id")
    .eq("id", parsed.data.session_id)
    .maybeSingle()

  if (se || !chatSession || chatSession.member_profile_id !== profile.id) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 })
  }

  const { count } = await supabase
    .from("staff_presence")
    .select("*", { count: "exact", head: true })
    .eq("availability", "online")

  const staffOnline = (count ?? 0) > 0

  if (staffOnline) {
    await supabase
      .from("chat_sessions")
      .update({
        status: "waiting_for_staff",
        requested_human: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.session_id)

    await supabase.from("chat_messages").insert({
      session_id: parsed.data.session_id,
      role: "system",
      message: "You are in the queue for a staff member.",
      metadata: {},
    })

    return NextResponse.json({ ok: true, mode: "queued" as const })
  }

  await supabase.from("chat_messages").insert({
    session_id: parsed.data.session_id,
    role: "system",
    message:
      "No staff are online right now. Leave your question here and we will follow up by email.",
    metadata: {},
  })

  return NextResponse.json({ ok: true, mode: "offline" as const })
}
