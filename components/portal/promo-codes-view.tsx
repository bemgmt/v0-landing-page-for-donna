"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"

type PromoCode = {
  id: string
  code: string
  status: string
  notes: string | null
}

export default function PromoCodesView({ promoCodes }: { promoCodes: PromoCode[] }) {
  const [origin, setOrigin] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  if (promoCodes.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="border border-white/10 rounded-xl liquid-glass p-6">
        <h3 className="text-lg font-medium text-foreground">Your Referral Links & Promo Codes</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Share these custom checkout or landing page referral links with your leads. When they use your code or sign up through your direct link, they receive the discount and you receive the commission automatically.
        </p>

        <div className="mt-6 space-y-6">
          {promoCodes.map((pc) => {
            const checkoutUrl = origin ? `${origin}/api/checkout?promo=${pc.code}` : `/api/checkout?promo=${pc.code}`
            const landingUrl = origin ? `${origin}/?promo=${pc.code}` : `/?promo=${pc.code}`

            return (
              <div key={pc.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Code:</span>
                    <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                      {pc.code}
                    </span>
                  </div>
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full capitalize font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {pc.status}
                  </span>
                </div>

                {pc.notes && (
                  <p className="text-xs text-muted-foreground italic">Note: {pc.notes}</p>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Direct Checkout Link (Recommended)
                    </span>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-2 text-xs">
                      <span className="font-mono truncate flex-1 text-foreground/80">{checkoutUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(checkoutUrl, pc.id + "-checkout")}
                        className="shrink-0 text-muted-foreground hover:text-cyan-300 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                        title="Copy Checkout Link"
                      >
                        {copiedId === pc.id + "-checkout" ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Landing Page Referral Link
                    </span>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-2 text-xs">
                      <span className="font-mono truncate flex-1 text-foreground/80">{landingUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(landingUrl, pc.id + "-landing")}
                        className="shrink-0 text-muted-foreground hover:text-cyan-300 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                        title="Copy Landing Link"
                      >
                        {copiedId === pc.id + "-landing" ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
