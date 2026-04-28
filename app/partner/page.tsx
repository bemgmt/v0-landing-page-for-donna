import Link from "next/link"
import { ActionList } from "@/components/portal/dashboard/action-list"
import { PageHeader } from "@/components/portal/dashboard/page-header"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import { requirePartnerPortal } from "@/lib/portal/require-partner"

const NOTEBOOKLM_URL =
  "https://notebooklm.google.com/notebook/ef6a20e1-9bc3-402a-91f0-11f286c2c943"

export default async function PartnerCommandCenterPage() {
  const session = await requirePartnerPortal()
  const { supabase, profile } = session

  const [{ data: sales }, { count: leadsOpen }, { count: forumPosts }] = await Promise.all([
    supabase
      .from("sales")
      .select("id, amount, status, sale_date, created_at")
      .eq("partner_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("lead_pool").select("*", { count: "exact", head: true }).eq("status", "unclaimed"),
    supabase.from("forum_posts").select("*", { count: "exact", head: true }).eq("author_profile_id", profile.id),
  ])

  const rows = sales ?? []
  const approved = rows.filter((s) => s.status === "approved" || s.status === "paid")
  const pending = rows.filter(
    (s) => s.status !== "approved" && s.status !== "paid" && s.status !== "rejected",
  )
  const totalValue = approved.reduce((acc, s) => acc + Number(s.amount ?? 0), 0)
  const recent = rows.slice(0, 3)

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-cyan-500/20 liquid-glass p-6 md:p-8 space-y-3">
        <p className="text-xs uppercase tracking-widest text-cyan-400/90 font-medium">Network active</p>
        <PageHeader
          title="Welcome to the Strategic Partner Network"
          subtitle="Your operational command center for sales, documents, and leads — guided next steps below."
        />
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/partner/start"
            className="inline-flex items-center justify-center rounded-lg animated-edge-button px-4 py-2 text-sm font-medium"
          >
            Start here
          </Link>
          <Link
            href="/partner/sales"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium hover:bg-white/5"
          >
            View sales
          </Link>
          <Link
            href="/partner/documents"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium hover:bg-white/5"
          >
            Partner documents
          </Link>
        </div>
      </div>

      <aside className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Commissions:</span> Rates and payout timing are in the{" "}
        <Link href="/api/portal/strategic-partner-docs/strategic-partner-program" className="text-cyan-300 hover:underline">
          Strategic Partner Program
        </Link>
        . Subscriptions include a <strong className="text-foreground">30-day money-back</strong> guarantee;{" "}
        <strong className="text-foreground">commissions may be charged back</strong> if a refund occurs in that window.
      </aside>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Approved / paid sales"
          value={String(approved.length)}
          href="/partner/sales"
        />
        <StatCard
          label="Approved value"
          value={totalValue.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          href="/partner/sales"
        />
        <StatCard
          label="Pending / in review"
          value={String(pending.length)}
          hint="Excludes rejected"
          href="/partner/sales"
        />
        <StatCard
          label="Open leads (pool)"
          value={String(leadsOpen ?? 0)}
          delta="+ network"
          href="/partner/leads/round-robin"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ActionList
          title="Recommended next actions"
          items={[
            {
              title: "Complete Start here checklist",
              description: "Orientation, docs, and first actions in order.",
              href: "/partner/start",
            },
            {
              title: "Download the Strategic Partner Program (.md)",
              description: "Official commission and policy reference.",
              href: "/api/portal/strategic-partner-docs/strategic-partner-program",
            },
            {
              title: "Claim available leads or review round robin",
              description: "See the pool before staff assigns rotation.",
              href: "/partner/leads/round-robin",
            },
            {
              title: "Open NotebookLM — DONNA deep context",
              description: "Curated reference (new tab).",
              href: NOTEBOOKLM_URL,
              external: true,
            },
            {
              title: "Practice with Can DONNA",
              description: "Member portal assistant for positioning.",
              href: "/portal/can-donna",
            },
            {
              title: "Ask questions in support chat",
              description: "Member portal live chat.",
              href: "/portal/support",
            },
          ]}
        />

        <section className="rounded-xl border border-white/10 liquid-glass overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <Link href="/partner/sales" className="text-xs text-cyan-300 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-white/10 flex-1">
            {recent.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">No sales rows yet.</li>
            ) : (
              recent.map((s) => (
                <li key={s.id} className="px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{s.status}</span>
                  <span className="text-muted-foreground ml-2">
                    {Number(s.amount ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {s.sale_date
                      ? new Date(s.sale_date).toLocaleDateString()
                      : new Date(s.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))
            )}
          </ul>
          <div className="px-4 py-3 border-t border-white/10 text-xs text-muted-foreground">
            Forum posts (you): {forumPosts ?? 0}{" "}
            <Link href="/portal/forum" className="text-cyan-300 hover:underline ml-1">
              Open forum
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
