import Link from "next/link"
import { format } from "date-fns"
import CheckoutStatusBanner from "@/components/checkout-status-banner"
import { PageHeader } from "@/components/portal/dashboard/page-header"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import { planShortLabel } from "@/lib/billing/plan-seats"
import { resolveActiveSeatInvitePlan, resolveSubscriptionPlan } from "@/lib/billing/resolve-subscription-plan"
import { hasPartnerCapabilities } from "@/lib/auth/roles"
import { getPortalSession } from "@/lib/portal/session"
import { fetchPortalCopy } from "@/lib/sanity/client"

export default async function PortalDashboardPage() {
  const session = await getPortalSession()
  if (!session) return null

  let copy: Awaited<ReturnType<typeof fetchPortalCopy>> = null
  try {
    copy = await fetchPortalCopy()
  } catch (e) {
    console.error("[portal] fetchPortalCopy failed", e)
  }
  const { supabase, profile, subscriptionActive, billing, seatAccess, user } = session
  const partner = hasPartnerCapabilities(profile.role, subscriptionActive)

  let subscriptionValue = subscriptionActive ? "Active" : "Not active"
  if (subscriptionActive) {
    if (billing && !seatAccess) {
      const snap = await resolveSubscriptionPlan(supabase, billing)
      const short = planShortLabel(snap.planKey)
      subscriptionValue = short ? `Active · ${short}` : "Active"
    } else if (seatAccess) {
      const snap = await resolveActiveSeatInvitePlan(user.email ?? profile.email)
      const short = planShortLabel(snap?.planKey ?? "")
      subscriptionValue = short ? `Active · ${short} (team)` : "Active (team)"
    }
  }

  const [{ count: salesCount }, { count: leadsOpen }] = await Promise.all([
    supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("partner_profile_id", profile.id)
      .in("status", ["approved", "paid"]),
    supabase
      .from("lead_pool")
      .select("*", { count: "exact", head: true })
      .eq("status", "unclaimed"),
  ])

  return (
    <div className="space-y-8">
      <CheckoutStatusBanner />
      <PageHeader
        eyebrow="Member portal"
        title="Dashboard"
        subtitle={`Signed in as ${profile.email ?? session.user.email}. Last updated ${format(new Date(profile.updated_at), "MMM d, yyyy")}.`}
      />

      {partner ? (
        <Link
          href="/partner"
          className="block rounded-2xl border border-cyan-500/25 liquid-glass p-5 hover:border-cyan-400/40 transition-colors"
        >
          <p className="text-xs uppercase tracking-widest text-cyan-400/90 font-medium">Strategic partner</p>
          <p className="text-lg font-semibold text-foreground mt-1">Open partner command center</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sales, commission documents, lead tools, and onboarding — separate from member billing and community.
          </p>
        </Link>
      ) : null}

      {copy?.portalHelpMarkdown ? (
        <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
          {copy.portalHelpMarkdown}
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Profile" value={profile.display_name ? "Complete" : "Add your name"} href="/portal/profile" />
        <StatCard label="Subscription" value={subscriptionValue} href="/portal/billing" />
        {partner ? (
          <>
            <StatCard
              label="Approved / paid sales"
              value={String(salesCount ?? 0)}
              href="/partner/sales"
            />
            <StatCard label="Open leads (pool)" value={String(leadsOpen ?? 0)} href="/partner/leads/round-robin" />
          </>
        ) : null}

      </div>
    </div>
  )
}
