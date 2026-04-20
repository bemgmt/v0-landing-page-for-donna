import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data } = await session.supabase
    .from("chat_sessions")
    .select("id, status, staff_profile_id, requested_human, created_at")
    .eq("member_profile_id", session.profile.id)
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1)

  return NextResponse.json({ session: data?.[0] ?? null })
}

export async function POST() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await session.supabase
    .from("chat_sessions")
    .insert({
      member_profile_id: session.profile.id,
      status: "ai",
      capability_mode: true,
    })
    .select("id, status")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ session: data })
}
