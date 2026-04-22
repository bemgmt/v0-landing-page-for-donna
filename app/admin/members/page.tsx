import MembersTable, { type MemberRow } from "@/components/admin/members-table"
import { getPortalSession } from "@/lib/portal/session"
import { createAdminClient } from "@/lib/supabase/admin"
import type { MemberRole } from "@/lib/auth/roles"
import { isRole } from "@/lib/auth/roles"

export default async function AdminMembersPage() {
  const session = await getPortalSession()
  if (!session) return null

  const admin = createAdminClient()
  const { data: profiles, error } = await admin
    .from("member_profiles")
    .select("id, user_id, email, display_name, role")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[admin/members]", error)
    return <p className="text-sm text-red-400">Could not load members.</p>
  }

  const list = profiles ?? []
  const userIds = list.map((p) => p.user_id)
  const { data: billingRows } =
    userIds.length > 0
      ? await admin
          .from("billing_subscriptions")
          .select("user_id, status, stripe_subscription_id, current_period_end, price_lookup_key")
          .in("user_id", userIds)
      : { data: [] as Record<string, unknown>[] }

  const billingByUser = new Map<string, NonNullable<MemberRow["billing"]>>()
  for (const row of billingRows ?? []) {
    const uid = row.user_id as string
    billingByUser.set(uid, {
      status: String(row.status),
      stripe_subscription_id: (row.stripe_subscription_id as string | null) ?? null,
      current_period_end: (row.current_period_end as string | null) ?? null,
      price_lookup_key: (row.price_lookup_key as string | null) ?? null,
    })
  }

  const rows: MemberRow[] = list.map((p) => {
    const roleRaw = p.role
    const role: MemberRole = isRole(roleRaw) ? roleRaw : "free_member"
    return {
      id: p.id,
      user_id: p.user_id,
      email: p.email,
      display_name: p.display_name,
      role,
      billing: billingByUser.get(p.user_id) ?? null,
    }
  })

  const canAdmin = session.profile.role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Canonical member directory for staff. Role changes, password resets, and billing repair require admin.
          Staff can view this list.
        </p>
      </div>
      <MembersTable rows={rows} canAdmin={canAdmin} />
    </div>
  )
}
