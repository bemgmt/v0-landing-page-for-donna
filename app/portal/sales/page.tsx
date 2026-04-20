import { requirePartnerPortal } from "@/lib/portal/require-partner"

export default async function SalesPage() {
  const session = await requirePartnerPortal()
  const { supabase, profile } = session

  const { data: sales } = await supabase
    .from("sales")
    .select("id, amount, status, attribution_source, sale_date, created_at")
    .eq("partner_profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const approved = (sales ?? []).filter((s) => s.status === "approved" || s.status === "paid")
  const total = approved.reduce((acc, s) => acc + Number(s.amount ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">Attributed sales for your partner account.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 liquid-glass p-4">
          <p className="text-xs uppercase text-muted-foreground">Approved / paid count</p>
          <p className="text-2xl font-semibold mt-1">{approved.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 liquid-glass p-4">
          <p className="text-xs uppercase text-muted-foreground">Approved value</p>
          <p className="text-2xl font-semibold mt-1">
            {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 liquid-glass p-4">
          <p className="text-xs uppercase text-muted-foreground">Recent rows</p>
          <p className="text-2xl font-semibold mt-1">{sales?.length ?? 0}</p>
        </div>
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
            {(sales ?? []).map((s) => (
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
        {(sales ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No sales yet.</p>
        ) : null}
      </div>
    </div>
  )
}
