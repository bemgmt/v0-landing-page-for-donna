import { createClient } from "@/lib/supabase/server"

export default async function AdminSalesPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("sales")
    .select("id, amount, status, attribution_source, partner_profile_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">Recent sales rows (staff view).</p>
      </div>
      <div className="rounded-xl border border-white/10 overflow-auto text-sm">
        <table className="w-full">
          <thead className="bg-white/5 text-muted-foreground text-left">
            <tr>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Source</th>
              <th className="p-2">Partner</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-2">{Number(r.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.attribution_source}</td>
                <td className="p-2 font-mono text-xs">{r.partner_profile_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
