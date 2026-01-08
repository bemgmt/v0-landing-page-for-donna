"use client"

import React, { useEffect, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { Rocket, Users, Layers, Wrench, Network, MessageSquare } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import ScrollDots from "@/components/scroll-dots"

interface FeatureCard {
  id: string
  icon: LucideIcon
  title: string
  subtitle: string
  description: string | React.ReactNode
}

const coreCapabilities: FeatureCard[] = [
  {
    id: "agentic",
    icon: Rocket,
    title: "Agentic, Not Scripted",
    subtitle: "AI that reasons, plans, and executes",
    description: (
      <>
        DONNA thinks and acts independently. It reasons
        <br />
        through problems, creates plans, executes tasks, and learns
        <br />
        from outcomes. It's not just following scripts.
      </>
    ),
  },
  {
    id: "human-loop",
    icon: Users,
    title: "Human in the Loop by Design",
    subtitle: "Automation that knows when to escalate",
    description: (
      <>
        DONNA handles routine tasks automatically but always knows
        <br />
        when to hand off to humans. Review, approve, or step in
        <br />
        with one click—you stay in control.
      </>
    ),
  },
  {
    id: "role-fluid",
    icon: Layers,
    title: "Role Fluid AI Floater",
    subtitle: "One AI, multiple roles",
    description: (
      <>
        DONNA dynamically shifts between roles—sales, marketing,
        <br />
        operations, secretary—without retraining. One digital employee
        <br />
        that adapts to your needs.
      </>
    ),
  },
  {
    id: "tool-native",
    icon: Wrench,
    title: "Tool Native Control",
    subtitle: "Controls tools, not just suggests",
    description: (
      <>
        DONNA doesn't just recommend actions—it controls your tools.
        <br />
        Sends emails, creates documents, launches campaigns, and triggers
        <br />
        workflows directly.
      </>
    ),
  },
  {
    id: "network-aware",
    icon: Network,
    title: "Network Aware",
    subtitle: "Connects with other DONNAs",
    description: (
      <>
        DONNA understands and communicates with other DONNAs across
        <br />
        teams, locations, or businesses. Secure, permissioned AI to AI
        <br />
        coordination.
      </>
    ),
  },
  {
    id: "multi-modal",
    icon: MessageSquare,
    title: "Multi Modal Communication",
    subtitle: "Voice, email, SMS, chat, and more",
    description: (
      <>
        Seamless communication across all channels. Real-time voice with
        <br />
        transcription, intelligent email handling, SMS, web chat, and live
        <br />
        dashboards—all in one system.
      </>
    ),
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
      id="capabilities"
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What <span className="gradient-text">DONNA Does</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto mb-8">
            Core capabilities that make DONNA your digital employee
          </p>
        </div>

        <div
          ref={railRef}
          className="hRail flex gap-4 overflow-x-auto pb-4 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {coreCapabilities.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.id}
                className="hCard liquid-glass-card p-6 rounded-xl refract-on-hover flex-shrink-0 flex flex-col group"
              >
                <div className="mb-4 flex-shrink-0">
                  <div className="mb-4 flex items-center">
                    <IconComponent className="w-8 h-8 text-accent transition-colors duration-300 group-hover:text-accent group-hover:opacity-100 opacity-90" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{feature.title}</h3>
                  <p className="text-xs text-accent font-medium mb-2">{feature.subtitle}</p>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed flex-grow overflow-hidden text-ellipsis line-clamp-6">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        <ScrollDots containerRef={railRef} itemCount={coreCapabilities.length} />
      </div>
    </section>
  )
}

