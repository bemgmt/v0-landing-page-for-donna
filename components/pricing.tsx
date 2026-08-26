"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { pushDataLayer } from "@/lib/data-layer"
import StripePricingTableEmbed from "@/components/stripe-pricing-table-embed"

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
    <section id="pricing" ref={ref} className="scroll-mt-20 py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 wow-glow">
            Early adopter access for the first 100 accounts
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
            Choose the team capacity that fits your business. Both plans include a 30-day free trial and usage allowances managed within the platform.
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
          <p className="mt-3 text-sm text-foreground/55">
            Represent an association or organization?{" "}
            <a
              href="mailto:derek@aidonna.co?subject=DONNA%20Network%20Partner%20Program"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Ask about the planned Network Partner Program.
            </a>
          </p>
        </div>

        <div className="mt-10 grid gap-4 text-sm text-foreground/60 sm:grid-cols-3">
          <p className="border-t border-white/10 pt-4"><span className="font-medium text-foreground/85">Customer-account limit.</span> Included seats do not count separately toward the first 100 accounts.</p>
          <p className="border-t border-white/10 pt-4"><span className="font-medium text-foreground/85">Configuration matters.</span> Available actions depend on connected integrations, permissions, data, and setup.</p>
          <p className="border-t border-white/10 pt-4"><span className="font-medium text-foreground/85">Published policy controls.</span> Cancellation and refund requests follow the current policy linked in the site footer.</p>
        </div>
      </div>
    </section>
  )
}
