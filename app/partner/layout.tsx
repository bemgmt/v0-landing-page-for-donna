import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import PartnerShell from "@/components/portal/partner-shell"
import PortalConfigError from "@/components/portal/portal-config-error"
import PortalProfileMissing from "@/components/portal/portal-profile-missing"
import { hasPartnerCapabilities } from "@/lib/auth/roles"
import { resolvePortalLayoutState } from "@/lib/portal/session"

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const state = await resolvePortalLayoutState()

  if (state.kind === "missing_supabase_env") {
    return <PortalConfigError />
  }

  if (state.kind === "unauthenticated") {
    redirect("/login?next=/partner")
  }

  if (state.kind === "no_member_profile") {
    return <PortalProfileMissing email={state.user.email} />
  }

  const { session } = state

  if (!hasPartnerCapabilities(session.profile.role, session.subscriptionActive)) {
    redirect("/portal/unauthorized")
  }

  return (
    <PartnerShell
      role={session.profile.role}
      subscriptionActive={session.subscriptionActive}
      seatAccess={session.seatAccess}
      displayName={session.profile.display_name ?? session.user.email ?? null}
    >
      {children}
    </PartnerShell>
  )
}
