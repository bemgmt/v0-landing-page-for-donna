"use client"

import { useInView } from "react-intersection-observer"

export default function Scale() {
  const { ref, inView } = useInView({ threshold: 0.1, once: true })

  return (
    <section id="scale" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-background/50">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Works Alone. Works Together. <span className="gradient-text">Grows With You.</span>
          </h2>
        </div>

        {/* Body content */}
        <div className="space-y-6 text-center animate-slide-up">
          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            DONNA works as a digital employee inside your business — answering calls, handling emails, booking appointments, and following up automatically.
          </p>

          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            As your business grows, DONNA can also securely coordinate with other DONNAs across teams, locations, or businesses. This reduces manual handoffs, expands your network, eliminates duplicated work, and keeps everything moving without slowing your team down.
          </p>

          <div className="glass-card p-6 rounded-xl text-left max-w-2xl mx-auto mt-8">
            <h3 className="text-xl font-bold mb-4 text-foreground">Network Benefits</h3>
            <ul className="space-y-3 text-foreground/80">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>B2B Automation:</strong> Schedule meetings, confirm contracts, and share status updates between companies without emails</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>Cross-Promotion:</strong> Coordinate marketing campaigns and referral programs across partner businesses</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>Vendor Coordination:</strong> Streamline supply chain updates and vendor communications automatically</span>
              </li>
            </ul>
          </div>

          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            All network connections are opt-in, permission-scoped, and fully auditable. You control who DONNA talks to and what information is shared.
          </p>

          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            You get more time back, faster responses, and the ability to scale without hiring.
          </p>

          {/* Micro-callout */}
          <div className="pt-6">
            <p className="text-sm text-foreground/50 italic">
              Advanced DONNA-to-DONNA coordination is available on higher plans.{" "}
              <a 
                href="#pricing" 
                className="text-accent hover:text-accent/80 transition-colors underline underline-offset-4"
              >
                See Plans
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

