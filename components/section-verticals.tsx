"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

const useCases = [
  {
    title: "Real Estate",
    icon: "◎",
    description: "Transform your real estate operations with your digital employee that handles property inquiries, schedules showings, qualifies leads, and follows up automatically. DONNA answers questions about listings, sends emails, creates documents, and syncs with your CRM—all autonomously.",
    outcomes: ["50% faster lead response", "Schedule 3x more showings", "40% higher conversion", "Instant property information"],
  },
  {
    title: "Hospitality",
    icon: "◈",
    description: "Elevate guest experiences with your 24/7 digital employee managing reservations, answering questions, coordinating room service, and providing concierge-level support. DONNA handles booking modifications, sends confirmations, creates invoices, and maintains your brand's voice automatically.",
    outcomes: ["24/7 reservation system", "Reduced staff workload", "Better guest experience", "Multilingual support"],
  },
  {
    title: "Professional Services",
    icon: "⬢",
    description: "Streamline client intake and appointment management with your digital employee for law firms, consulting agencies, and professional practices. DONNA collects intake forms, schedules consultations, sends reminders, creates documents, and manages follow-ups so your team can focus on billable work.",
    outcomes: ["Streamlined intake process", "Fewer no-shows", "More billable hours", "Automated follow-ups"],
  },
  {
    title: "Health & Beauty",
    icon: "⟳",
    description: "Manage your salon, spa, or wellness center with your digital employee handling appointment booking, service inquiries, and client communication. DONNA controls your scheduling system, sends confirmations, processes cancellations, and creates marketing campaigns—all without manual intervention.",
    outcomes: ["Automated appointment booking", "Reduced no-shows", "24/7 client support", "Service upselling"],
  },
]

export default function SectionVerticals() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 3 })
    }
  }, [inView])

  return (
    <section
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-primary/5"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for <span className="gradient-text">Your Industry</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            DONNA powers businesses across industries with tailored solutions
          </p>
        </div>

        <div className="hRail flex gap-3.5 overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollSnapType: 'x mandatory' }}>
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="hCard glass-card p-6 rounded-xl glow-accent transition-all duration-300 flex-shrink-0"
            >
              <div className="text-4xl mb-4">{useCase.icon}</div>
              <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
              <p className="text-foreground/70 mb-4 text-sm leading-relaxed">{useCase.description}</p>
              <div className="space-y-2">
                {useCase.outcomes.map((outcome, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-accent">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {outcome}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

