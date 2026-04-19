"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import StackedLayersVisualization from "@/components/stacked-layers-visualization"
import { Calendar, CheckCircle2, Mail } from "lucide-react"

const pillars = [
  {
    title: "Communication",
    body: "Email, text, calls, chat — unified context so nothing slips through.",
    Icon: Mail,
  },
  {
    title: "Coordination",
    body: "Scheduling, follow-ups, reminders — synchronized across everyone involved.",
    Icon: Calendar,
  },
  {
    title: "Execution",
    body: "Tasks, next steps, deal progression — what needs to happen actually happens.",
    Icon: CheckCircle2,
  },
]

export default function SectionCapabilities() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 4 })
    }
  }, [inView])

  return (
    <section
      id="what-donna-does"
      ref={ref}
      className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            What DONNA actually does
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
            One continuous system for how deals actually move
          </h2>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            DONNA connects everything already in your business into one continuous system.
          </p>
          <ul className="space-y-5">
            {pillars.map(({ title, body, Icon }) => (
              <li key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent shrink-0" aria-hidden />
                  {title}
                </p>
                <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
          <p className="text-base sm:text-lg text-foreground/85 pt-2 border-t border-white/10">
            Not another tool.{" "}
            <span className="font-medium text-foreground">
              The layer that makes your tools work together.
            </span>
          </p>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <StackedLayersVisualization />
          </div>
        </div>
      </div>
    </section>
  )
}
