import "server-only"

import { redirect } from "next/navigation"
import { hasPartnerCapabilities } from "@/lib/auth/roles"
import { getPortalSession } from "@/lib/portal/session"

export async function requirePartnerPortal() {
  const session = await getPortalSession()
  if (!session) redirect("/login?next=/partner")

  if (!hasPartnerCapabilities(session.profile.role, session.subscriptionActive)) {
    redirect("/portal/unauthorized")
  }

  return session
}
