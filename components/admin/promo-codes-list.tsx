"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { togglePromoCodeStatusAction } from "@/app/admin/partners/actions"
import { toast } from "sonner"

type PromoCode = {
  id: string
  code: string
  share_slug: string | null
  status: string
  notes: string | null
  created_at: string
  stripe_promotion_code_id: string | null
  stripe_coupon_id: string | null
  partner: {
    id: string
    display_name: string | null
    email: string | null
  } | null
}

export default function PromoCodesList({ promoCodes }: { promoCodes: PromoCode[] }) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await togglePromoCodeStatusAction(id, currentStatus)
      if (res.success) {
        toast.success("Promo code status updated successfully.")
        router.refresh()
      } else {
        toast.error(res.error || "Failed to update promo code status.")
      }
    } catch (err) {
      toast.error("Failed to update status")
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
      case "inactive":
        return "bg-amber-500/10 border border-amber-500/20 text-amber-400"
      default:
        return "bg-white/10 border border-white/20 text-muted-foreground"
    }
  }

  return (
    <div className="rounded-xl border border-white/10 liquid-glass overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <h3 className="text-lg font-medium text-foreground">Generated Promo Codes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          List of all active and inactive Stripe-backed promo codes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Salesperson</th>
              <th className="px-6 py-3">Notes</th>
              <th className="px-6 py-3">Stripe IDs</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {promoCodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  No promo codes generated yet. Use the form above to create the first one.
                </td>
              </tr>
            ) : (
              promoCodes.map((pc) => (
                <tr key={pc.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/20 px-2 py-1 rounded">
                      {pc.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">
                      {pc.partner?.display_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">{pc.partner?.email}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-muted-foreground" title={pc.notes || ""}>
                    {pc.notes || "—"}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground space-y-1">
                    <div>Promo: {pc.stripe_promotion_code_id || "None"}</div>
                    <div>Coupon: {pc.stripe_coupon_id || "None"}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${getStatusBadgeClass(pc.status)}`}>
                      {pc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={updatingId === pc.id}
                      onClick={() => handleToggleStatus(pc.id, pc.status)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                        pc.status === "active"
                          ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400"
                          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                    >
                      {updatingId === pc.id
                        ? "Updating..."
                        : pc.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
