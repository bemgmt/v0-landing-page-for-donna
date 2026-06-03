import { requirePartnerPortal } from "@/lib/portal/require-partner"
import PromoCodesView from "@/components/portal/promo-codes-view"

export const dynamic = "force-dynamic"

export default async function PartnerSalesPage() {
  const { supabase, profile } = await requirePartnerPortal()

  // 1. Fetch sales for this partner
  const { data: rows } = await supabase
    .from("sales")
    .select("id, amount, status, attribution_source, created_at")
    .eq("partner_profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50)

  // 2. Fetch active promo codes for this partner
  const { data: promoCodes } = await supabase
    .from("promo_codes")
    .select("id, code, status, notes")
    .eq("partner_profile_id", profile.id)
    .eq("status", "active")

  const salesRows = rows ?? []
  const codesList = promoCodes ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Sales & Referrals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track sales attributed to your promotion codes and view pending commissions.
        </p>
      </div>

      <PromoCodesView promoCodes={codesList} />

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Attributed Sales</h2>
        <div className="rounded-xl border border-white/10 overflow-auto text-sm liquid-glass">
          <table className="w-full">
            <thead className="bg-white/5 text-muted-foreground text-left">
              <tr>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Attribution</th>
                <th className="p-4">Sale Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {salesRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No sales attributed to you yet.
                  </td>
                </tr>
              ) : (
                salesRows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-semibold text-foreground">
                      {Number(r.amount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full capitalize ${
                        r.status === "paid" || r.status === "approved"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : r.status === "rejected"
                          ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground capitalize">
                      {r.attribution_source.replace("_", " ")}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

