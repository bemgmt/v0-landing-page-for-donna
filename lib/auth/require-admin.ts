import "server-only"

import { getPortalSession } from "@/lib/portal/session"

export async function requireAdmin() {
  const session = await getPortalSession()
  if (!session) return null
  if (session.profile.role !== "admin") return null
  return session
}
