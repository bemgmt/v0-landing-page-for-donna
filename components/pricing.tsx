"use client"

import { useInView } from "react-intersection-observer"

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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
            Early Access Pricing for Businesses Ready to Lead
          </h2>
          <p className="text-base sm:text-lg text-foreground/70">
            Paid beta access for operators who want infrastructure-level AI before launch.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 sm:p-10 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/50 mb-4">Paid Beta Access</p>
          <div className="text-4xl sm:text-5xl font-semibold mb-2">$1,500 / month</div>
          <p className="text-sm text-foreground/60 mb-6">Month-to-month for the first year</p>
          <div className="space-y-2 text-sm sm:text-base text-foreground/75 max-w-2xl mx-auto">
            <p>Pro-level capabilities (normally $5,000 / month)</p>
            <p>Early access to the full DONNA platform</p>
            <p>Direct influence on how DONNA adapts to your industry</p>
            <p>Priority feature consideration during beta</p>
            <p>Opportunity for revenue share after beta completion</p>
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
            Why $1,500 / month Is a Strategic Deal
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-[720px] w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="text-foreground/60">
                  <th className="py-3 px-4 font-medium sticky left-0 bg-background/95">Option</th>
                  <th className="py-3 px-4 font-medium">Monthly Cost</th>
                  <th className="py-3 px-4 font-medium">Commitment</th>
                  <th className="py-3 px-4 font-medium">What You Actually Get</th>
                </tr>
              </thead>
              <tbody className="text-foreground/70">
                <tr className="bg-white/5">
                  <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-white/10">DONNA (Paid Beta)</td>
                  <td className="py-3 px-4 font-semibold text-foreground">$1,500</td>
                  <td className="py-3 px-4">Month-to-month</td>
                  <td className="py-3 px-4">Communication, operations, lead gen, coordination, network intelligence</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sticky left-0 bg-background/95">ZoomInfo</td>
                  <td className="py-3 px-4">~$1,500</td>
                  <td className="py-3 px-4">12-month contract</td>
                  <td className="py-3 px-4">Lead data only</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sticky left-0 bg-background/95">CRM + Email + Chat + Scheduler</td>
                  <td className="py-3 px-4">$800–$2,000</td>
                  <td className="py-3 px-4">Multiple contracts</td>
                  <td className="py-3 px-4">Fragmented tools, no shared intelligence</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sticky left-0 bg-background/95">Ads + Lead Services</td>
                  <td className="py-3 px-4">$1,000–$5,000+</td>
                  <td className="py-3 px-4">Ongoing spend</td>
                  <td className="py-3 px-4">Variable results, no operational lift</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sticky left-0 bg-background/95">Part-time employee</td>
                  <td className="py-3 px-4">$3,000–$4,500</td>
                  <td className="py-3 px-4">Ongoing</td>
                  <td className="py-3 px-4">Single role, limited hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 text-center">
          <h4 className="text-xl font-semibold mb-3">What DONNA Replaces</h4>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base text-foreground/70">
            <span>Multiple SaaS tools</span>
            <span>Lead lists and intent platforms</span>
            <span>Manual follow-ups and coordination</span>
            <span>Large portions of admin and ops roles</span>
            <span>Wasted ad spend chasing low-intent leads</span>
          </div>
          <p className="text-base sm:text-lg text-foreground/80 mt-6">
            At $1,500, this replaces far more than it costs.
          </p>
        </div>
      </div>
    </section>
  )
}
