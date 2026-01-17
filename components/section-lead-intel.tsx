"use client"

import { useInView } from "react-intersection-observer"

export default function SectionLeadIntel() {
  const { ref } = useInView({ threshold: 0.2, once: true })

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built-in <span className="gradient-text">Lead Discovery</span>
          </h2>
          <p className="text-base md:text-lg text-foreground/70">
            DONNA includes an ethical data intelligence system that helps identify
            potential customers in your industry—without buying lists or scraping
            personal data.
          </p>
        </div>

        <div className="glass-card border border-white/10 rounded-xl p-6 sm:p-8 animate-slide-up">
          <p className="text-foreground/80 leading-relaxed">
            It finds relevant businesses, enriches context, and feeds qualified
            opportunities directly into outreach workflows, so your team can focus
            on real conversations instead of research.
          </p>
        </div>
      </div>
    </section>
  )
}
