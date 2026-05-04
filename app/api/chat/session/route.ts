import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"

  const query = session.supabase
    .from("chat_sessions")
    .select("id, status, staff_profile_id, requested_human, created_at, member_profile_id, member_profiles(display_name, email)")
    .neq("status", "closed")

  if (!isStaff) {
    query.eq("member_profile_id", session.profile.id)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ sessions: data ?? [] })
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

export async function PATCH(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => ({}))
  const { id, status, requested_human, staff_profile_id } = json

  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"

  // If not staff, they can only update their own session and only certain fields
  if (!isStaff) {
    const { data: check } = await session.supabase
      .from("chat_sessions")
      .select("member_profile_id")
      .eq("id", id)
      .maybeSingle()

    if (!check || check.member_profile_id !== session.profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const updates: any = {}
  if (status) updates.status = status
  if (requested_human !== undefined) updates.requested_human = requested_human
  if (isStaff && staff_profile_id) updates.staff_profile_id = staff_profile_id

  const { data, error } = await session.supabase
    .from("chat_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ session: data })
}
