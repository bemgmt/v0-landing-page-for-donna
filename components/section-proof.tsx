"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import ScrollDots from "@/components/scroll-dots"

interface Stat {
  value: string
  label: string
  description: string
}

const stats: Stat[] = [
  {
    value: "50M+",
    label: "Calls Handled",
    description: "Across enterprise clients",
  },
  {
    value: "100K+",
    label: "Hours Saved",
    description: "Per month by clients",
  },
  {
    value: "85%",
    label: "Lead Conversion",
    description: "Higher than industry average",
  },
  {
    value: "99.9%",
    label: "Uptime",
    description: "Guaranteed availability",
  },
]

const testimonials = [
  {
    quote:
      "DONNA has transformed how we handle incoming calls. Our team can focus on high-value work while she handles 90% of our scheduling requests.",
    author: "Sarah Chen",
    company: "Chen & Associates Real Estate",
  },
  {
    quote:
      "We went from losing leads to capturing 95% of incoming inquiries. The ROI was immediate and the implementation was painless.",
    author: "Marcus Johnson",
    company: "Johnson Home Services",
  },
  {
    quote:
      "The team loved the seamless Salesforce integration. Leads flow directly into our system without any manual data entry.",
    author: "Elena Rodriguez",
    company: "Horizon Hospitality Group",
  },
]

export default function SectionProof() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const [counters, setCounters] = useState<Record<number, number>>({})
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 5 })
    }
  }, [inView])

  useEffect(() => {
    if (!inView) return

    stats.forEach((stat, index) => {
      const numValue = Number.parseInt(stat.value)
      if (isNaN(numValue)) return

      const interval = setInterval(() => {
        setCounters((prev) => {
          const current = prev[index] || 0
          const increment = Math.ceil(numValue / 30)
          const newValue = Math.min(current + increment, numValue)
          return { ...prev, [index]: newValue }
        })
      }, 50)

      return () => clearInterval(interval)
    })
  }, [inView])

  const allItems = [
    ...stats.map((stat, index) => ({
      type: "stat" as const,
      data: stat,
      index,
    })),
    ...testimonials.map((testimonial, index) => ({
      type: "testimonial" as const,
      data: testimonial,
      index: index + stats.length,
    })),
  ]

  return (
    <section
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-primary/5"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proven <span className="gradient-text">Results</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Measurable outcomes and trusted by business leaders
          </p>
        </div>

        <div
          ref={railRef}
          className="hRail flex gap-3.5 overflow-x-auto pb-4 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {allItems.map((item) => (
            <div
              key={`${item.type}-${item.index}`}
              className="hCard liquid-glass-card p-8 rounded-xl refract-on-hover flex-shrink-0"
            >
              {item.type === "stat" ? (
                <>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                    {counters[item.index] || 0}
                    {item.data.value.slice(-1) === "%" ? "%" : item.data.value.slice(-1) === "+" ? "+" : ""}
                  </div>
                  <div className="font-semibold text-foreground mb-1">{item.data.label}</div>
                  <div className="text-sm text-foreground/50">{item.data.description}</div>
                </>
              ) : (
                <>
                  <p className="text-foreground/80 italic mb-4 text-sm leading-relaxed">"{item.data.quote}"</p>
                  <div className="font-semibold text-sm">{item.data.author}</div>
                  <div className="text-xs text-foreground/60">{item.data.company}</div>
                  <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-xs">⭐</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <ScrollDots containerRef={railRef} itemCount={allItems.length} />
      </div>
    </section>
  )
}

