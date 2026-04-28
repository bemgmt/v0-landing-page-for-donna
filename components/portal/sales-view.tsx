import Link from "next/link"
import type { SupabaseClient } from "@supabase/supabase-js"
import { PageHeader } from "@/components/portal/dashboard/page-header"
import { StatCard } from "@/components/portal/dashboard/stat-card"

type SaleRow = {
  id: string
  amount: number | null
  status: string
  attribution_source: string | null
  sale_date: string | null
  created_at: string
}

type Props = {
  supabase: SupabaseClient
  partnerProfileId: string
}

export default async function SalesView({ supabase, partnerProfileId }: Props) {
  const { data: sales } = await supabase
    .from("sales")
    .select("id, amount, status, attribution_source, sale_date, created_at")
    .eq("partner_profile_id", partnerProfileId)
    .order("created_at", { ascending: false })
    .limit(50)

  const rows = (sales ?? []) as SaleRow[]
  const approved = rows.filter((s) => s.status === "approved" || s.status === "paid")
  const pending = rows.filter((s) => s.status !== "approved" && s.status !== "paid" && s.status !== "rejected")
  const total = approved.reduce((acc, s) => acc + Number(s.amount ?? 0), 0)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partner"
        title="Sales"
        subtitle="Attributed sales for your partner account. Commission rates and payout rules are in the Strategic Partner Program document."
      />

      <aside className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground space-y-2">
        <p>
          <span className="text-amber-200/90 font-medium">Refund window:</span> All subscriptions include a{" "}
          <strong className="text-foreground">30-day money-back guarantee</strong>. Commissions may be{" "}
          <strong className="text-foreground">charged back or reversed</strong> if the customer receives a refund
          within that period.
        </p>
        <p>
          <Link href="/partner/documents" className="text-cyan-300 hover:underline">
            Download partner documents
          </Link>{" "}
          including the full commission schedule.
        </p>
      </aside>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved / paid count" value={String(approved.length)} />
        <StatCard label="Approved value" value={total.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
        <StatCard
          label="Pending / other statuses"
          value={String(pending.length)}
          hint="Awaiting approval or in refund window"
        />
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-white/10">
                <td className="p-3 whitespace-nowrap">
                  {s.sale_date
                    ? new Date(s.sale_date).toLocaleDateString()
                    : new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {Number(s.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </td>
                <td className="p-3">{s.status}</td>
                <td className="p-3">{s.attribution_source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No sales yet.</p> : null}
      </div>
    </div>
  )
}
