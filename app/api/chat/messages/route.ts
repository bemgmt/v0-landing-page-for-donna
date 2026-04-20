import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session_id")
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 })
  }

  let ctx = await getPortalSession()
  if (!ctx) {
    const staff = await requireStaffOrAdmin()
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    ctx = staff
  }

  const { supabase, profile } = ctx

  const { data: chatSession, error: csErr } = await supabase
    .from("chat_sessions")
    .select("id, member_profile_id, status")
    .eq("id", sessionId)
    .maybeSingle()

  if (csErr || !chatSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isStaff = profile.role === "staff" || profile.role === "admin"
  const isOwner = chatSession.member_profile_id === profile.id

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: msgs, error } = await supabase
    .from("chat_messages")
    .select("id, role, message, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ messages: msgs ?? [] })
}
