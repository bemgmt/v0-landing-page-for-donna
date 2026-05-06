"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

const ecosystemCards = [
  {
    category: "Brokerages",
    headline: "Front-line deals and client relationships.",
    description: "DONNA keeps deal communication and next steps aligned across your team.",
  },
  {
    category: "Mortgage & lending",
    headline: "Timing that used to live in email threads.",
    description: "Loan milestones and handoffs stay visible so financing doesn’t stall the file.",
  },
  {
    category: "Title & closing",
    headline: "The finish line where details matter most.",
    description: "Closing tasks and dependencies stay coordinated through the last signature.",
  },
  {
    category: "Inspectors & insurance",
    headline: "Vendors in the flow, not outside it.",
    description: "Inspections, repairs, and coverage steps connect to the same deal timeline.",
  },
]

const categories = ecosystemCards.map((c) => c.category)

export default function SectionVerticals() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const railRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 5 })
    }
  }, [inView])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const handleScroll = () => {
      const width = rail.clientWidth
      if (!width) return
      const nextIndex = Math.round(rail.scrollLeft / width)
      setActiveIndex(Math.min(Math.max(nextIndex, 0), ecosystemCards.length - 1))
    }

    handleScroll()
    rail.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      rail.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  return (
    <section id="ecosystem" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
            Real estate ecosystem
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
            Built for how real estate actually works
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
            Real estate isn&apos;t one business. It&apos;s a network — brokerages, mortgage, title,
            inspectors, insurance. DONNA connects the flow between them.
          </p>
        </div>

        <div className="sticky top-0 z-10 backdrop-blur-sm bg-background/70 border-b border-white/5">
          <div className="flex gap-4 overflow-x-auto py-3 text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground/50">
            {categories.map((label, index) => (
              <span
                key={label}
                className={`whitespace-nowrap transition-colors ${
                  activeIndex === index ? "text-foreground" : "text-foreground/40"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div ref={railRef} className="usecase-rail -mx-4 px-4 pb-6 mt-6">
          {ecosystemCards.map((card, index) => (
            <article key={card.category} className="usecase-card wow-card">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground/50 mb-3">
                {card.category}
              </p>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3">{card.headline}</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">{card.description}</p>
              <div className="mt-6 text-xs text-foreground/50">
                Segment {index + 1} of {ecosystemCards.length}
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          {ecosystemCards.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-8 bg-foreground/80" : "w-3 bg-foreground/30"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-lg sm:text-xl font-medium text-foreground/90 mt-12">
          Less chasing. More closing.
        </p>
        <div className="mt-8 text-center max-w-2xl mx-auto">
          <div className="glass-card p-6 rounded-2xl border border-accent/20 bg-accent/5 inline-block text-left shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <p className="text-base sm:text-lg text-foreground font-medium mb-2">
              Want to see how DONNA would handle your specific workflow? Ask it.
            </p>
            <p className="text-sm sm:text-base text-foreground/70">
              Open the chatbot in the corner to run a hypothetical scenario. Please avoid sharing sensitive personal or financial information.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
