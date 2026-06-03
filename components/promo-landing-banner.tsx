"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Copy, Check, X } from "lucide-react"

function PromoLandingBannerInner() {
  const searchParams = useSearchParams()
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 1. Check query parameter first
    const urlPromo = searchParams.get("promo")
    if (urlPromo) {
      localStorage.setItem("donna_promo_code", urlPromo.toUpperCase())
      setPromoCode(urlPromo.toUpperCase())
      setVisible(true)
      return
    }

    // 2. Fallback to localStorage
    const storedPromo = localStorage.getItem("donna_promo_code")
    if (storedPromo) {
      setPromoCode(storedPromo)
      setVisible(true)
    }
  }, [searchParams])

  const handleCopy = async () => {
    if (!promoCode) return
    try {
      await navigator.clipboard.writeText(promoCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy promo code:", err)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
  }

  if (!visible || !promoCode) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-[250] mx-auto max-w-lg rounded-xl border border-cyan-500/40 bg-cyan-950/90 px-4 py-3 text-sm text-cyan-50 shadow-lg backdrop-blur-md md:left-1/2 md:right-auto md:-translate-x-1/2 flex items-center justify-between gap-3 animate-fade-in"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="shrink-0 flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        <p className="truncate">
          Partner discount active:{" "}
          <strong className="font-mono text-cyan-300 bg-cyan-900/50 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
            {promoCode}
          </strong>
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20 transition-colors text-cyan-200 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md p-1 text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function PromoLandingBanner() {
  return (
    <Suspense fallback={null}>
      <PromoLandingBannerInner />
    </Suspense>
  )
}
