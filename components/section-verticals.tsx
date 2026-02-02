"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

const useCaseCards = [
  {
    category: "Customer Communication",
    headline: "When customers reach out, DONNA handles it.",
    description:
      "Messages, emails, website chats, and calls are handled with shared context and consistent tone. Nothing gets missed.",
  },
  {
    category: "Operations Coordination",
    headline: "When work needs to move, DONNA coordinates it.",
    description:
      "Scheduling, follow-ups, task handoffs, and internal updates happen automatically without rigid workflows.",
  },
  {
    category: "Growth & Intent",
    headline: "When growth matters, DONNA focuses on intent.",
    description:
      "Instead of wasting money on broad advertising, DONNA identifies real interest and prepares outreach aligned with how buyers actually behave.",
  },
]

const categories = ["Customer Communication", "Operations Coordination", "Growth & Intent"]

export default function SectionVerticals() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const railRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 3 })
    }
  }, [inView])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const handleScroll = () => {
      const width = rail.clientWidth
      if (!width) return
      const nextIndex = Math.round(rail.scrollLeft / width)
      setActiveIndex(Math.min(Math.max(nextIndex, 0), useCaseCards.length - 1))
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
    <section id="use-cases" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
            How SMBs use DONNA
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
            Real use cases. Real operations.
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto">
            I can picture this running my day-to-day without hiring more people.
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

        <div
          ref={railRef}
          className="usecase-rail -mx-4 px-4 pb-6 mt-6"
        >
          {useCaseCards.map((card, index) => (
            <article key={card.category} className="usecase-card wow-card">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground/50 mb-3">
                {card.category}
              </p>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3">{card.headline}</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">{card.description}</p>
              <div className="mt-6 text-xs text-foreground/50">Use case {index + 1} of {useCaseCards.length}</div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          {useCaseCards.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-8 bg-foreground/80" : "w-3 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
