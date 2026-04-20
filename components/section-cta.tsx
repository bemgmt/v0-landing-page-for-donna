"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { checkoutErrorMessage, startStripeCheckout } from "@/lib/start-checkout"

export default function SectionCTA() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 10 })
    }
  }, [inView])

  const handleCheckout = async () => {
    track("checkout_click", { placement: "final_cta" })
    setCheckoutLoading(true)
    const result = await startStripeCheckout()
    setCheckoutLoading(false)
    const msg = checkoutErrorMessage(result)
    if (msg) window.alert(msg)
  }

  return (
    <section id="section-cta" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow leading-tight">
          Real estate moves fast.
          <br />
          Your system should too.
        </h2>
        <p className="text-base sm:text-lg text-foreground/75 max-w-2xl mx-auto leading-relaxed">
          Stop relying on memory, manual work, and disconnected tools. Start running your business on a
          system.
        </p>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-accent text-background font-semibold hover:bg-accent/90 transition-all disabled:opacity-60"
        >
          {checkoutLoading ? "Redirecting…" : "Get DONNA — $500/month"}
        </button>
      </div>
    </section>
  )
}
