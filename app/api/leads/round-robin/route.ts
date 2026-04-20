import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { hasPartnerCapabilities } from "@/lib/auth/roles"

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasPartnerCapabilities(session.profile.role, session.subscriptionActive)) {
    return NextResponse.json({ error: "Partner access required" }, { status: 403 })
  }

  const { supabase } = session

  const [{ data: queue }, { data: leads }] = await Promise.all([
    supabase.from("round_robin_state").select("*").eq("queue_name", "default").maybeSingle(),
    supabase
      .from("lead_pool")
      .select("id, lead_name, lead_email, status, created_at")
      .eq("status", "unclaimed")
      .order("created_at", { ascending: true })
      .limit(50),
  ])

  return NextResponse.json({
    queue: queue ?? null,
    unclaimed: leads ?? [],
  })
}
