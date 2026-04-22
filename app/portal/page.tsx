import Link from "next/link"
import { format } from "date-fns"
import CheckoutStatusBanner from "@/components/checkout-status-banner"
import { planShortLabel } from "@/lib/billing/plan-seats"
import { resolveActiveSeatInvitePlan, resolveSubscriptionPlan } from "@/lib/billing/resolve-subscription-plan"
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

  const [{ count: salesCount }, { count: leadsOpen }, { count: forumPosts }] = await Promise.all([
    supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("partner_profile_id", profile.id)
      .in("status", ["approved", "paid"]),
    supabase
      .from("lead_pool")
      .select("*", { count: "exact", head: true })
      .eq("status", "unclaimed"),
    supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_profile_id", profile.id),
  ])

  const cards = [
    { label: "Profile", value: profile.display_name ? "Complete" : "Add your name", href: "/portal/profile" },
    {
      label: "Subscription",
      value: subscriptionValue,
      href: "/portal/billing",
    },
    { label: "Approved / paid sales", value: String(salesCount ?? 0), href: "/portal/sales" },
    { label: "Open leads (pool)", value: String(leadsOpen ?? 0), href: "/portal/leads/round-robin" },
    { label: "Your forum posts", value: String(forumPosts ?? 0), href: "/portal/forum" },
  ]

  return (
    <div className="space-y-8">
      <CheckoutStatusBanner />
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Signed in as {profile.email ?? session.user.email}. Last updated{" "}
          {format(new Date(profile.updated_at), "MMM d, yyyy")}
        </p>
      </div>

      {copy?.portalHelpMarkdown ? (
        <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
          {copy.portalHelpMarkdown}
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="text-lg font-medium mt-1">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
