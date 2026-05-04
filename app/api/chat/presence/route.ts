import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await session.supabase
    .from("staff_presence")
    .select("profile_id, availability, updated_at")
    .eq("availability", "online")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ online_staff: data ?? [] })
}

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const json = await request.json().catch(() => ({}))
  const { availability } = json

  if (!availability || !["online", "away", "offline"].includes(availability)) {
    return NextResponse.json({ error: "Invalid availability" }, { status: 400 })
  }

  const { data, error } = await session.supabase
    .from("staff_presence")
    .upsert({
      profile_id: session.profile.id,
      availability,
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ presence: data })
}
