"use client"

import React, { useEffect, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { Megaphone, DollarSign, Headphones, Phone, FileText, Target, BarChart, Bot } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import ScrollDots from "@/components/scroll-dots"

interface ToolCard {
  id: string
  icon: LucideIcon
  title: string
  description: React.ReactNode
}

const donnaTools: ToolCard[] = [
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing",
    description: (
      <>
        DONNA creates and executes campaigns autonomously, not just
        <br />
        suggesting ideas. It writes copy, schedules posts, tracks performance,
        <br />
        and optimizes in real time across all channels without constant oversight.
      </>
    ),
  },
  {
    id: "sales",
    icon: DollarSign,
    title: "Sales",
    description: (
      <>
        DONNA qualifies leads, follows up automatically, and closes deals
        <br />
        through natural conversations. Unlike CRMs that just track, DONNA
        <br />
        actively engages prospects, answers questions, and books meetings 24/7.
      </>
    ),
  },
  {
    id: "customer-service",
    icon: Headphones,
    title: "Customer Service",
    description: (
      <>
        DONNA handles support across voice, email, chat, and SMS simultaneously.
        <br />
        It remembers full conversation history, escalates only when needed,
        <br />
        and resolves issues without transferring customers between departments.
      </>
    ),
  },
  {
    id: "receptionist",
    icon: Phone,
    title: "Receptionist",
    description: (
      <>
        DONNA answers calls, takes messages, schedules appointments, and routes
        <br />
        inquiries intelligently. It understands context, handles complex requests,
        <br />
        and never puts callers on hold or transfers unnecessarily.
      </>
    ),
  },
  {
    id: "secretary",
    icon: FileText,
    title: "Secretary",
    description: (
      <>
        DONNA attends meetings, transcribes notes, creates action items, and follows
        <br />
        up automatically. It manages calendars, sends reminders, and coordinates
        <br />
        schedules across teams without manual input.
      </>
    ),
  },
  {
    id: "lead-generation",
    icon: Target,
    title: "Lead Generation",
    description: (
      <>
        DONNA actively finds and qualifies leads through conversations, not just
        <br />
        scraping data. It engages prospects naturally, asks the right questions,
        <br />
        and nurtures relationships until they're ready to buy.
      </>
    ),
  },
  {
    id: "analytics",
    icon: BarChart,
    title: "Analytics",
    description: (
      <>
        DONNA doesn't just show you data—it analyzes patterns, identifies
        <br />
        opportunities, and recommends actions. It connects insights across all
        <br />
        your tools and explains what the numbers mean in plain language.
      </>
    ),
  },
  {
    id: "chatbot",
    icon: Bot,
    title: "Chatbot",
    description: (
      <>
        DONNA goes beyond scripted responses. It reasons through complex
        <br />
        questions, accesses your knowledge base, controls your tools, and completes
        <br />
        tasks—not just answering FAQs but actually helping customers.
      </>
    ),
  },
]

export default function SectionTools() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 3 })
    }
  }, [inView])

  return (
    <section
      id="tools"
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="gradient-text">DONNA's Tools</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto mb-8">
            How DONNA handles your business operations differently
          </p>
        </div>

        <div
          ref={railRef}
          className="hRail flex gap-4 overflow-x-auto pb-4 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {donnaTools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <div
                key={tool.id}
                className="hCard liquid-glass-card p-6 rounded-xl refract-on-hover flex-shrink-0 flex flex-col group"
              >
                <div className="mb-4 flex-shrink-0">
                  <div className="mb-4 flex items-center">
                    <IconComponent className="w-8 h-8 text-accent transition-colors duration-300 group-hover:text-accent group-hover:opacity-100 opacity-90" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{tool.title}</h3>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed flex-grow overflow-hidden text-ellipsis line-clamp-6">
                  {tool.description}
                </p>
              </div>
            )
          })}
        </div>

        <ScrollDots containerRef={railRef} itemCount={donnaTools.length} />
      </div>
    </section>
  )
}
