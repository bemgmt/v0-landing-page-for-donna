"use client"

import { pushDataLayer } from "@/lib/data-layer"

export default function CTAFooter() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your <span className="gradient-text">Office Operations?</span>
        </h2>
        <p className="text-foreground/70 mb-8 text-lg max-w-2xl mx-auto">
          Join hundreds of businesses using DONNA to handle calls, emails, and scheduling automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => {
              pushDataLayer({ event: "schedule_demo_click", placement: "cta_footer" })
              const form = document.getElementById("demo-form")
              form?.scrollIntoView({ behavior: "smooth" })
            }}
            className="px-8 py-3 rounded-lg bg-accent text-background hover:bg-accent/90 transition-all font-semibold glow-accent hover:shadow-[0_0_30px_rgba(132,204,255,0.5)]"
          >
            Request a Demo
          </button>
          <button
            type="button"
            onClick={() => {
              pushDataLayer({ event: "sign_up_click", placement: "cta_footer_pilot" })
              const form = document.getElementById("pilot-form")
              form?.scrollIntoView({ behavior: "smooth" })
            }}
            className="px-8 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors font-semibold"
          >
            Join the Pilot
          </button>
        </div>

        <p className="text-foreground/50 text-sm mt-6">
          30-day free trial • No credit card required • Setup in minutes
        </p>
      </div>
    </section>
  )
}
