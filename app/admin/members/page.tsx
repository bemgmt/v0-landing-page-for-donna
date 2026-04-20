import MembersRoleSelect from "@/components/admin/members-role-select"
import { getPortalSession } from "@/lib/portal/session"

export default async function AdminMembersPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { data: rows } = await session.supabase
    .from("member_profiles")
    .select("id, email, display_name, role")
    .order("created_at", { ascending: false })
    .limit(200)

  const canAdmin = session.profile.role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Role changes require admin. Staff can view this list.
        </p>
      </div>
      <MembersRoleSelect rows={(rows ?? []) as never} canAdmin={canAdmin} />
    </div>
  )
}
