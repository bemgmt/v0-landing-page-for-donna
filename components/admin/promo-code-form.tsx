"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generatePromoCodeAction } from "@/app/admin/partners/actions"
import { toast } from "sonner"

type Partner = {
  id: string
  email: string | null
  display_name: string | null
}

export default function PromoCodeForm({ partners }: { partners: Partner[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [partnerProfileId, setPartnerProfileId] = useState("")
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage")
  const [discountValue, setDiscountValue] = useState<number>(10)
  const [duration, setDuration] = useState<"once" | "forever" | "repeating">("forever")
  const [durationInMonths, setDurationInMonths] = useState<number>(3)
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerProfileId) {
      toast.error("Please select a partner profile")
      return
    }
    if (!code.trim()) {
      toast.error("Please enter a promotion code")
      return
    }

    setLoading(true)
    try {
      // If it's amount, convert the dollars entered to cents for Stripe
      const value = discountType === "amount" ? Math.round(discountValue * 100) : discountValue

      const res = await generatePromoCodeAction({
        partnerProfileId,
        code,
        discountType,
        discountValue: value,
        duration,
        durationInMonths: duration === "repeating" ? durationInMonths : undefined,
        notes,
      })

      if (res.success) {
        toast.success("Promo code successfully generated in Stripe and Supabase!")
        setCode("")
        setNotes("")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error("Failed to generate promo code")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 liquid-glass p-6 space-y-4">
      <h3 className="text-lg font-medium text-foreground">Generate New Promo Code</h3>
      <p className="text-xs text-muted-foreground">
        Creates a Coupon and Promotion Code directly in Stripe and saves it to your database.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="partner-select" className="text-xs font-semibold text-muted-foreground uppercase">
            Salesperson / Partner
          </label>
          <select
            id="partner-select"
            value={partnerProfileId}
            onChange={(e) => setPartnerProfileId(e.target.value)}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground focus:border-cyan-400 focus:outline-none"
            required
          >
            <option value="" className="bg-black">-- Select Partner --</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id} className="bg-black">
                {p.display_name || p.email} ({p.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="code-input" className="text-xs font-semibold text-muted-foreground uppercase">
            Promo Code
          </label>
          <input
            id="code-input"
            type="text"
            placeholder="e.g. PARTNER10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground uppercase placeholder:text-muted-foreground focus:border-cyan-400 focus:outline-none font-mono"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="discount-type" className="text-xs font-semibold text-muted-foreground uppercase">
            Discount Type
          </label>
          <select
            id="discount-type"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as any)}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground focus:border-cyan-400 focus:outline-none"
          >
            <option value="percentage" className="bg-black">Percentage Off</option>
            <option value="amount" className="bg-black">Fixed Amount Off</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="discount-value" className="text-xs font-semibold text-muted-foreground uppercase">
            {discountType === "percentage" ? "Percentage Off (%)" : "Amount Off ($ USD)"}
          </label>
          <input
            id="discount-value"
            type="number"
            min="0.01"
            step={discountType === "percentage" ? "1" : "0.01"}
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground focus:border-cyan-400 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="duration-select" className="text-xs font-semibold text-muted-foreground uppercase">
            Duration
          </label>
          <select
            id="duration-select"
            value={duration}
            onChange={(e) => setDuration(e.target.value as any)}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground focus:border-cyan-400 focus:outline-none"
          >
            <option value="forever" className="bg-black">Forever (Recurring)</option>
            <option value="once" className="bg-black">Once (First Month)</option>
            <option value="repeating" className="bg-black">Repeating (Multiple Months)</option>
          </select>
        </div>
      </div>

      {duration === "repeating" && (
        <div className="flex flex-col gap-1.5 max-w-[200px]">
          <label htmlFor="duration-months" className="text-xs font-semibold text-muted-foreground uppercase">
            Number of Months
          </label>
          <input
            id="duration-months"
            type="number"
            min="1"
            max="12"
            value={durationInMonths}
            onChange={(e) => setDurationInMonths(Number(e.target.value))}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground focus:border-cyan-400 focus:outline-none"
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes-area" className="text-xs font-semibold text-muted-foreground uppercase">
          Internal Notes (Optional)
        </label>
        <textarea
          id="notes-area"
          rows={2}
          placeholder="For tracking or special partner terms..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-sm bg-black/40 border border-white/10 rounded-lg p-2.5 text-foreground focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-cyan-500 hover:bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Generating Stripe Promo Code..." : "Generate Promo Code"}
        </button>
      </div>
    </form>
  )
}
