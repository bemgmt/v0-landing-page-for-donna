import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import PortalConfigError from "@/components/portal/portal-config-error"
import PortalProfileMissing from "@/components/portal/portal-profile-missing"
import PortalShell from "@/components/portal/portal-shell"
import { portalReturnPath } from "@/lib/auth/return-path"
import { resolvePortalLayoutState } from "@/lib/portal/session"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const state = await resolvePortalLayoutState()

  if (state.kind === "missing_supabase_env") {
    return <PortalConfigError />
  }

  if (state.kind === "unauthenticated") {
    const requestHeaders = await headers()
    const nextPath = portalReturnPath(requestHeaders.get("x-donna-request-path"))
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  if (state.kind === "no_member_profile") {
    return <PortalProfileMissing email={state.user.email} />
  }

  const { session } = state

  return (
    <PortalShell
      role={session.profile.role}
      subscriptionActive={session.subscriptionActive}
      seatAccess={session.seatAccess}
      displayName={session.profile.display_name ?? session.user.email ?? null}
    >
      {children}
    </PortalShell>
  )
}
