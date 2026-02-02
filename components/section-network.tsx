"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import SignalPulsesVisualization from "@/components/signal-pulses-visualization"

export default function SectionNetwork() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 4 })
    }
  }, [inView])

  return (
    <section ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="order-2 lg:order-1 flex items-center justify-center">
          <div className="w-full max-w-md wow-card">
            <SignalPulsesVisualization />
          </div>
        </div>
        <div className="order-1 lg:order-2 space-y-5">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            Network intelligence
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow">
            Your business doesn’t operate alone.
          </h2>
          <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
            Through the DONNA-to-DONNA Network, businesses benefit from shared operational
            intelligence without sharing private data.
          </p>
          <div className="space-y-1 text-base sm:text-lg text-foreground/80">
            <p>Patterns improve.</p>
            <p>Decisions get smarter.</p>
            <p>Outcomes compound.</p>
          </div>
          <p className="text-base sm:text-lg text-foreground/70">Same system. Different industries.</p>
        </div>
      </div>
    </section>
  )
}

