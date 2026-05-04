import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import AdminShell from "@/components/admin/admin-shell"
import { getPortalSession } from "@/lib/portal/session"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession()
  if (!session) {
    redirect("/login?next=/admin")
  }
  if (session.profile.role !== "admin") {
    redirect("/portal/unauthorized")
  }

  return <AdminShell role={session.profile.role}>{children}</AdminShell>
}
