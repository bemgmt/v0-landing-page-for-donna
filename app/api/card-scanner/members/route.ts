import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Active partner/staff/admin members for the share picker (excludes current user). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: me } = await supabase
    .from("member_profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!me || !["admin", "staff", "partner"].includes(me.role)) {
    return NextResponse.json(
      { error: "Partner, staff, or admin access required" },
      { status: 403 }
    )
  }

  const { data: members, error } = await supabase
    .from("member_profiles")
    .select("id, display_name, company_name, avatar_url")
    .in("role", ["partner", "staff", "admin"])
    .eq("is_active", true)
    .neq("id", me.id)
    .order("display_name")

  if (error) {
    return NextResponse.json(
      { error: "Failed to load members" },
      { status: 500 }
    )
  }

  return NextResponse.json({ members: members ?? [] })
}
