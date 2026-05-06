"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import StackedLayersVisualization from "@/components/stacked-layers-visualization"

const layers = [
  {
    title: "Analytics",
    description: "Real-time visibility into deal progression, pipeline health, and operational bottlenecks.",
  },
  {
    title: "AI Agents",
    description: "Specialized models that execute tasks, draft responses, and coordinate parties autonomously.",
  },
  {
    title: "Knowledge Base",
    description: "Your firm's unique intelligence—contracts, templates, and procedures—embedded into every action.",
  },
  {
    title: "Data Sources",
    description: "Seamless integration with your existing CRM, email, and transaction management platforms.",
  },
]

export default function SectionStackedLayers() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: "stacked-layers" })
    }
  }, [inView])

  return (
    <section ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5">
      <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1 flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <StackedLayersVisualization />
          </div>
        </div>
        
        <div className="order-1 lg:order-2 space-y-8 lg:pl-10">
          <div className="space-y-4">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
              The Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
              Four pillars working together.
            </h2>
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
              Real estate already runs on relationships, deadlines, and coordination. DONNA is the AI layer that makes all three run automatically by connecting your fragmented stack.
            </p>
          </div>

          <div className="space-y-6">
            {layers.map((layer) => (
              <div key={layer.title} className="relative pl-6 before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-accent before:rounded-full before:opacity-80">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {layer.title}
                </h3>
                <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
                  {layer.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
