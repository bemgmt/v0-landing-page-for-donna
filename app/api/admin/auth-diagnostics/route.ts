import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"

export async function GET() {
  const session = await requireStaffOrAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  if (session.profile.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const admin = createAdminClient()
  
  const { data, error } = await admin
    .from("auth_diagnostics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[auth-diagnostics] Fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data })
}
