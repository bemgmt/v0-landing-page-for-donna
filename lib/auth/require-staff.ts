import "server-only"

import { getPortalSession } from "@/lib/portal/session"

export async function requireStaffOrAdmin() {
  const session = await getPortalSession()
  if (!session) return null
  if (session.profile.role !== "staff" && session.profile.role !== "admin") return null
  return session
}
