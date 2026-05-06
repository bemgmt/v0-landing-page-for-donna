"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { Calendar, CheckCircle2, Mail } from "lucide-react"

const pillars = [
  {
    title: "Unified Context",
    body: "Synchronizes every signal across your communication channels into a single intelligence feed.",
    Icon: Mail,
  },
  {
    title: "Network Alignment",
    body: "Automates the handoffs between agents, lenders, and vendors to eliminate friction.",
    Icon: Calendar,
  },
  {
    title: "Autonomous Execution",
    body: "Drives tasks through to completion by bridging the gap between your CRM and your operations.",
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
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            Operational Infrastructure
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
            AI is the engine.
            <br />
            DONNA is the system that makes it work.
          </h2>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            DONNA connects everything already in your business into one continuous workflow. We replace the gaps between your fragmented tools, structuring AI directly into your operations.
          </p>
        </div>
        
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map(({ title, body, Icon }) => (
            <li key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 flex flex-col items-center text-center transition-all hover:bg-white/[0.05]">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-accent shrink-0" aria-hidden />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {title}
              </p>
              <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>

        <div className="text-center pt-8 border-t border-white/10 space-y-2">
          <p className="text-base sm:text-lg text-foreground/85">
            DONNA isn&apos;t another AI tool.
          </p>
          <p className="font-semibold text-foreground text-xl">It&apos;s the system your business runs on.</p>
        </div>
      </div>
    </section>
  )
}
