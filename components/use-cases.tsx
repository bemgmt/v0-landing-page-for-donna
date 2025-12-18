"use client"

import { useInView } from "react-intersection-observer"

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

export default function UseCases() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  return (
    <section id="use-cases" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for <span className="gradient-text">Your Industry</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            DONNA powers businesses across industries with tailored solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="glass-card p-8 rounded-xl glow-accent transition-all duration-300 hover:glow-accent hover:shadow-[0_0_30px_rgba(122,92,255,0.2)] animate-slide-up group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl mb-4 group-hover:animate-float">{useCase.icon}</div>
              <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
              <p className="text-foreground/70 mb-4 text-sm">{useCase.description}</p>
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
