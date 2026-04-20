import { NextResponse } from "next/server"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"

export async function GET() {
  const session = await requireStaffOrAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { supabase } = session

  const { data: waitingRaw } = await supabase
    .from("chat_sessions")
    .select("id, status, requested_human, member_profile_id, created_at")
    .eq("status", "waiting_for_staff")
    .order("created_at", { ascending: true })

  const { data: liveRaw } = await supabase
    .from("chat_sessions")
    .select("id, status, staff_profile_id, member_profile_id, created_at")
    .eq("status", "live")
    .order("created_at", { ascending: false })

  const ids = [
    ...new Set([
      ...(waitingRaw ?? []).map((w) => w.member_profile_id),
      ...(liveRaw ?? []).map((l) => l.member_profile_id),
    ]),
  ].filter(Boolean) as string[]

  const { data: profiles } =
    ids.length > 0
      ? await supabase.from("member_profiles").select("id, display_name, email").in("id", ids)
      : { data: [] }

  const map = new Map((profiles ?? []).map((p) => [p.id, p]))

  return NextResponse.json({
    waiting: (waitingRaw ?? []).map((w) => ({
      ...w,
      member: map.get(w.member_profile_id) ?? null,
    })),
    live: (liveRaw ?? []).map((l) => ({
      ...l,
      member: map.get(l.member_profile_id) ?? null,
    })),
  })
}
