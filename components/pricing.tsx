"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import PricingComparisonChart from "@/components/pricing-comparison-chart"
import { startStripeCheckout } from "@/lib/start-checkout"

const valueBullets = [
  "Coordinates your entire deal flow",
  "Maximizes your current team",
  "Increases response speed",
  "Prevents missed revenue",
  "Connects you to the DONNA network",
]

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 8 })
    }
  }, [inView])

  const handleCheckout = async () => {
    track("checkout_click", { placement: "pricing_card" })
    setCheckoutLoading(true)
    const result = await startStripeCheckout()
    setCheckoutLoading(false)
    if (!result.ok) {
      window.alert(result.error)
    }
  }

  const handleScrollToForm = () => {
    const form = document.getElementById("demo-form")
    form?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="pricing" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 wow-glow">
            Early access is $500/month
          </h2>
          <p className="text-base sm:text-lg text-foreground/70">
            Not per seat. Not per feature. For your entire operation.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 sm:p-10 text-center wow-card">
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/50 mb-4">
            Early access — real estate operators
          </p>
          <div className="text-4xl sm:text-5xl font-semibold mb-2">$500 / month</div>
          <p className="text-sm text-foreground/60 mb-8">No long-term contract required at early access.</p>
          <ul className="space-y-3 text-sm sm:text-base text-foreground/80 max-w-xl mx-auto text-left list-none">
            {valueBullets.map((line) => (
              <li key={line} className="flex gap-3 items-start justify-center sm:justify-start">
                <span className="text-accent mt-0.5 shrink-0" aria-hidden>
                  ✔
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-base sm:text-lg text-foreground/85 mt-10 max-w-2xl mx-auto font-medium">
            One missed deal pays for it. Everything after that is upside.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full font-semibold transition-all duration-300 bg-accent text-background hover:bg-accent/90 disabled:opacity-60"
            >
              {checkoutLoading ? "Redirecting…" : "Get Early Access — $500/month"}
            </button>
            <button
              type="button"
              onClick={handleScrollToForm}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full font-semibold border border-white/20 text-foreground/90 hover:bg-white/10 transition-colors"
            >
              Questions? Contact us
            </button>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
            DONNA vs Fragmented Tools
          </h3>
          <PricingComparisonChart />
        </div>

        <div className="mt-10 text-center">
          <p className="text-base sm:text-lg text-foreground/80 mt-6">
            A single fragmented tool such as ZoomInfo can be $1,500 / month, and a tool stack like GHL
            plus email workflows adds more cost while still delivering only a portion of what DONNA
            offers — at early access pricing.
          </p>
        </div>
      </div>
    </section>
  )
}
