"use client"

import { useEffect, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import ScrollDots from "@/components/scroll-dots"

interface FeatureCard {
  id: string
  icon: string
  title: string
  subtitle: string
  description: string
}

const coreCapabilities: FeatureCard[] = [
  {
    id: "agentic",
    icon: "🧠",
    title: "Agentic, Not Scripted",
    subtitle: "AI that reasons, plans, and executes",
    description:
      "DONNA thinks and acts independently. It reasons through problems, creates plans, executes tasks, and learns from outcomes—not just following scripts.",
  },
  {
    id: "human-loop",
    icon: "🤝",
    title: "Human-in-the-Loop by Design",
    subtitle: "Automation that knows when to escalate",
    description:
      "DONNA handles routine tasks automatically but always knows when to hand off to humans. Review, approve, or step in with one click—you stay in control.",
  },
  {
    id: "role-fluid",
    icon: "🔄",
    title: "Role-Fluid AI Floater",
    subtitle: "One AI, multiple roles",
    description:
      "DONNA dynamically shifts between roles—sales, marketing, operations, secretary—without retraining. One digital employee that adapts to your needs.",
  },
  {
    id: "tool-native",
    icon: "⚙️",
    title: "Tool-Native Control",
    subtitle: "Controls tools, not just suggests",
    description:
      "DONNA doesn't just recommend actions—it controls your tools. Sends emails, creates documents, launches campaigns, and triggers workflows directly.",
  },
  {
    id: "network-aware",
    icon: "🌐",
    title: "Network-Aware",
    subtitle: "Connects with other DONNAs",
    description:
      "DONNA understands and communicates with other DONNAs across teams, locations, or businesses. Secure, permissioned AI-to-AI coordination.",
  },
  {
    id: "multi-modal",
    icon: "💬",
    title: "Multi-Modal Communication",
    subtitle: "Voice, email, SMS, chat, and more",
    description:
      "Seamless communication across all channels. Real-time voice with transcription, intelligent email handling, SMS, web chat, and live dashboards—all in one system.",
  },
]

export default function SectionCapabilities() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 2 })
    }
  }, [inView])

  return (
    <section
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What <span className="gradient-text">DONNA Does</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Core capabilities that make DONNA your digital employee
          </p>
        </div>

        <div
          ref={railRef}
          className="hRail flex gap-3.5 overflow-x-auto pb-4 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {coreCapabilities.map((feature) => (
            <div
              key={feature.id}
              className="hCard liquid-glass-card p-6 rounded-xl refract-on-hover flex-shrink-0 flex flex-col"
            >
              <div className="mb-3 flex-shrink-0">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold text-foreground mb-1.5 leading-tight">{feature.title}</h3>
                <p className="text-xs text-accent font-medium mb-2">{feature.subtitle}</p>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed flex-grow overflow-hidden text-ellipsis line-clamp-6">{feature.description}</p>
            </div>
          ))}
        </div>

        <ScrollDots containerRef={railRef} itemCount={coreCapabilities.length} />
      </div>
    </section>
  )
}

