"use client"

import { useEffect } from "react"
import Script from "next/script"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import PricingComparisonChart from "@/components/pricing-comparison-chart"
import StripePricingTableEmbed from "@/components/stripe-pricing-table-embed"

const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID ?? ""
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 8 })
    }
  }, [inView])

  const handleScrollToForm = () => {
    const form = document.getElementById("demo-form")
    form?.scrollIntoView({ behavior: "smooth" })
  }

  const hasStripeEmbed = pricingTableId.length > 0 && publishableKey.length > 0

  return (
    <section id="pricing" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <Script src="https://js.stripe.com/v3/pricing-table.js" strategy="afterInteractive" />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 wow-glow">
            Early access for real estate operators
          </h2>
          <p className="text-base sm:text-lg text-foreground/70">
            Choose the plan that fits your team. Prices and features are shown in the table below.
          </p>
        </div>

        <div className="w-full max-w-6xl mx-auto min-h-[200px]">
          {hasStripeEmbed ? (
            <StripePricingTableEmbed />
          ) : process.env.NODE_ENV === "development" ? (
            <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-foreground/70">
              Set{" "}
              <code className="text-foreground/90">NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID</code> and{" "}
              <code className="text-foreground/90">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in{" "}
              <code className="text-foreground/90">.env.local</code> to render the Stripe pricing table.
            </p>
          ) : null}
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
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">DONNA vs Fragmented Tools</h3>
          <PricingComparisonChart />
        </div>

        <div className="mt-10 text-center">
          <p className="text-base sm:text-lg text-foreground/80 mt-6">
            A single fragmented tool such as ZoomInfo can be $1,500 / month, and a tool stack like GHL plus email
            workflows adds more cost while still delivering only a portion of what DONNA offers — at early access
            pricing.
          </p>
        </div>
      </div>
    </section>
  )
}
