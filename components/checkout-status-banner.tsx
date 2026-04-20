"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function CheckoutStatusBannerInner() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get("checkout")
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [checkout])

  if (dismissed || !checkout) return null

  if (checkout === "success") {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-lg rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-3 text-sm text-emerald-50 shadow-lg backdrop-blur-md md:left-1/2 md:right-auto md:-translate-x-1/2"
      >
        <div className="flex items-start justify-between gap-3">
          <p>
            <strong className="font-semibold">Welcome aboard.</strong> Your checkout completed — we&apos;ll
            follow up with next steps.
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md px-2 py-1 text-emerald-200 hover:bg-white/10"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  if (checkout === "canceled") {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-lg rounded-xl border border-white/20 bg-background/95 px-4 py-3 text-sm text-foreground shadow-lg backdrop-blur-md md:left-1/2 md:right-auto md:-translate-x-1/2"
      >
        <div className="flex items-start justify-between gap-3">
          <p>
            Checkout canceled. When you&apos;re ready, you can try{" "}
            <strong className="font-semibold">Get DONNA</strong> again — no rush.
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md px-2 py-1 text-foreground/80 hover:bg-white/10"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function CheckoutStatusBanner() {
  return (
    <Suspense fallback={null}>
      <CheckoutStatusBannerInner />
    </Suspense>
  )
}
