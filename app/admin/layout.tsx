import type React from "react"
import { redirect } from "next/navigation"
import AdminShell from "@/components/admin/admin-shell"
import { getPortalSession } from "@/lib/portal/session"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession()
  if (!session) {
    redirect("/login?next=/admin")
  }
  if (session.profile.role !== "staff" && session.profile.role !== "admin") {
    redirect("/portal/unauthorized")
  }

  return <AdminShell role={session.profile.role}>{children}</AdminShell>
}
