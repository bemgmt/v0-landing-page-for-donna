"use client"

import { useInView } from "react-intersection-observer"

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  const handleScrollToForm = () => {
    const form = document.getElementById("demo-form")
    form?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="pricing" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Beta Program <span className="gradient-text">Access</span>
          </h2>
          <p className="text-base md:text-lg text-foreground/70">
            DONNA is currently onboarding a limited group of beta partners.
            The beta program is not free. It is designed for serious operators
            who want early access to infrastructure-level AI before public availability.
          </p>
        </div>

        <div className="glass-card border border-white/10 rounded-xl p-6 sm:p-8 animate-slide-up">
          <h3 className="text-xl md:text-2xl font-bold mb-4">Beta Program Offer</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/80 mb-6">
            <li>• Full Pro-level capabilities</li>
            <li>• All enterprise-grade operational features</li>
            <li>• Priority onboarding and configuration support</li>
            <li>• Direct feedback loop with the DONNA team</li>
          </ul>

          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-semibold mb-3">Beta Pricing</h4>
            <p className="text-foreground/80 mb-4">
              One full year of Pro-level access — at the Starter plan price.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/80 mb-6">
              <li>• Deploy DONNA deeply across operations</li>
              <li>• Validate real operational ROI</li>
              <li>• Lock in preferred access ahead of general release</li>
              <li>• Transition to Pro or Enterprise after year one</li>
            </ul>
            <p className="text-sm text-foreground/70 mb-6">
              Beta access is limited. We are intentionally onboarding slowly to ensure
              operational quality and long-term success.
            </p>
            <button
              onClick={handleScrollToForm}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all duration-300 bg-accent text-background hover:bg-accent/90"
            >
              Apply to the Beta Program
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
