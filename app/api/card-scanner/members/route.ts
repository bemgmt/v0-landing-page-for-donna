import { NextResponse } from "next/server"
import { requirePortalRole } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"

/** Active partner/staff/admin members for the share picker (excludes current user). */
export async function GET() {
  const session = await requirePortalRole(["admin", "staff", "partner"])
  if (!session) {
    return NextResponse.json(
      { error: "Partner, staff, or admin access required" },
      { status: 403 }
    )
  }

  const admin = createAdminClient()
  const { data: members, error } = await admin
    .from("member_profiles")
    .select("id, display_name, company_name, avatar_url")
    .in("role", ["partner", "staff", "admin"])
    .eq("is_active", true)
    .neq("id", session.profile.id)
    .order("display_name")

  if (error) {
    return NextResponse.json(
      { error: "Failed to load members" },
      { status: 500 }
    )
  }

  return NextResponse.json({ members: members ?? [] })
}
