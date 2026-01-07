"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

interface Vertical {
  title: string
  icon: string
  description: string
  outcomes: string[]
}

const useCases: Vertical[] = [
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
  const [selectedVertical, setSelectedVertical] = useState<number>(0)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 3 })
    }
  }, [inView])

  const selectedData = useCases[selectedVertical]

  return (
    <section
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for <span className="gradient-text">Your Industry</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            DONNA powers businesses across industries with tailored solutions
          </p>
        </div>

        {/* Centered Card Container - Apple "Significant Others" Pattern */}
        <div className="liquid-glass-card rounded-2xl p-6 md:p-12 max-w-5xl mx-auto">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Panel: Selectable List */}
            <div className="space-y-2 order-2 md:order-1">
              {useCases.map((vertical, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVertical(index)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 relative ${
                    index === selectedVertical
                      ? "liquid-glass border-2 border-accent/50 bg-white/15"
                      : "liquid-glass-clear border border-white/10 hover:bg-white/10 animated-edge-button"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{vertical.icon}</span>
                    <span className="font-semibold text-foreground">{vertical.title}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Panel: Dynamic Content */}
            <div className="flex flex-col justify-center order-1 md:order-2">
              <div
                key={selectedVertical}
                className="animate-fade-in-content"
              >
                <div className="text-5xl md:text-6xl mb-4">{selectedData.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">{selectedData.title}</h3>
                <p className="text-sm md:text-base text-foreground/80 mb-6 leading-relaxed">{selectedData.description}</p>
                <div className="space-y-3">
                  {selectedData.outcomes.map((outcome, i) => (
                    <div key={i} className="flex items-center gap-3 text-accent">
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
