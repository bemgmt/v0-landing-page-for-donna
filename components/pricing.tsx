"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { pushDataLayer } from "@/lib/data-layer"
import PricingComparisonChart from "@/components/pricing-comparison-chart"
import StripePricingTableEmbed from "@/components/stripe-pricing-table-embed"
import Link from "next/link"

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 8 })
    }
  }, [inView])

  const handleScrollToForm = () => {
    pushDataLayer({ event: "schedule_demo_click", placement: "pricing_questions" })
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
            Early Infrastructure Access
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
            Early deployment offers foundational advantages: influence over system evolution, priority network integration, and fixed infrastructure costs.
          </p>
        </div>

        <div className="w-full max-w-6xl mx-auto min-h-[200px]">
          <StripePricingTableEmbed />
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={handleScrollToForm}
            className="text-sm text-foreground/70 underline-offset-4 hover:underline"
          >
            Questions? Contact us
          </button>
        </div>

        <div className="mt-12">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Integrated System vs. Fragmented Stack</h3>
          <PricingComparisonChart />
        </div>

        <div className="mt-10 text-center">
          <p className="text-base sm:text-lg text-foreground/80 mt-6">
            A single fragmented tool such as ZoomInfo can be $1,500 / month, and a tool stack like GHL plus email
            workflows adds more cost while still delivering only a portion of what DONNA offers â€” at early access
            pricing.
          </p>
          <div className="mt-8 flex justify-center">
            <Link 
              href="/tool-audit" 
              className="inline-flex items-center justify-center rounded-lg bg-background/50 border border-accent/30 px-6 py-3 text-sm font-medium text-accent hover:bg-accent/10 hover:border-accent hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300"
            >
              Compare against your stack
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
