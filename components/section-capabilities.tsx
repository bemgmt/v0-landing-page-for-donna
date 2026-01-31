"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import NetworkVisualization from "@/components/network-visualization"

export default function SectionCapabilities() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 2 })
    }
  }, [inView])

  return (
    <section
      id="what-donna-is"
      ref={ref}
      className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            What DONNA is
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
            DONNA is not software you use.
          </h2>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            DONNA is an operational intelligence layer that sits beneath a business.
          </p>
          <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
            It coordinates communication, workflows, and decisions across tools, teams, and
            channels — without forcing you to change how you work.
          </p>
          <p className="text-base sm:text-lg text-foreground/85 leading-relaxed">
            This is not automation. This is how modern businesses run.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <NetworkVisualization />
          </div>
        </div>
      </div>
    </section>
  )
}

