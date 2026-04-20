import type React from "react"
import { redirect } from "next/navigation"
import PortalShell from "@/components/portal/portal-shell"
import { getPortalSession } from "@/lib/portal/session"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession()
  if (!session) {
    redirect("/login?next=/portal")
  }

  return (
    <PortalShell
      role={session.profile.role}
      subscriptionActive={session.subscriptionActive}
      displayName={session.profile.display_name ?? session.user.email ?? null}
    >
      {children}
    </PortalShell>
  )
}
