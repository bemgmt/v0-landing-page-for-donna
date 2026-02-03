"use client"

import { useInView } from "react-intersection-observer"
import PricingComparisonChart from "@/components/pricing-comparison-chart"

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

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
            Early Access Pricing for Businesses Ready to Lead
          </h2>
          <p className="text-base sm:text-lg text-foreground/70">
            Private deployment access for operators who want infrastructure-level AI before launch.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 sm:p-10 text-center wow-card">
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/50 mb-4">Private Deployment Access</p>
          <div className="text-4xl sm:text-5xl font-semibold mb-2">$1,500 / month</div>
          <p className="text-sm text-foreground/60 mb-6">Month-to-month for the first year</p>
          <div className="space-y-2 text-sm sm:text-base text-foreground/75 max-w-2xl mx-auto">
            <p>Pro-level capabilities (normally $5,000 / month)</p>
            <p>Early access to the full DONNA platform</p>
            <p>Direct influence on how DONNA adapts to your industry</p>
            <p>Priority feature consideration during private deployment</p>
            <p>Opportunity for revenue share after private deployment completion</p>
          </div>
          <p className="text-xs sm:text-sm text-foreground/50 mt-6">
            This is not discounted software. This is early participation in infrastructure.
          </p>
          <button
            onClick={handleScrollToForm}
            className="mt-6 w-full sm:w-auto px-6 py-2.5 rounded-full font-semibold transition-all duration-300 bg-accent text-background hover:bg-accent/90"
          >
            Request Access
          </button>
        </div>

        <div className="mt-12">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
            DONNA vs Fragmented Tools
          </h3>
          <PricingComparisonChart />
        </div>

        <div className="mt-10 text-center">
          <p className="text-base sm:text-lg text-foreground/80 mt-6">
            A single fragmented tool such as ZoomInfo can be $1,500 / month, and a tool stack
            like GHL + email workflows adds more cost while still delivering only a portion of
            what DONNA offers.
          </p>
        </div>
      </div>
    </section>
  )
}
