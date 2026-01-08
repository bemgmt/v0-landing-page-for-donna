"use client"

import React, { useEffect, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import ScrollDots from "@/components/scroll-dots"

const networkUseCases = [
  {
    title: "Business to Business Automation",
    description: (
      <>
        Schedule meetings, confirm contracts, and share status
        <br />
        updates between companies without manual emails or phone calls.
      </>
    ),
    icon: "🤝",
  },
  {
    title: "Marketing & Growth Coordination",
    description: (
      <>
        Cross-promote campaigns, verify referrals, and hand off leads
        <br />
        between partner businesses automatically.
      </>
    ),
    icon: "📈",
  },
  {
    title: "Operations & Vendor Management",
    description: (
      <>
        Coordinate supply chain updates, vendor communications, and compliance
        <br />
        confirmations across your network.
      </>
    ),
    icon: "⚙️",
  },
  {
    title: "Manufacturing & Logistics",
    description: (
      <>
        Coordinate production schedules, shipping updates, and inventory
        <br />
        management between manufacturers, suppliers, and distributors.
      </>
    ),
    icon: "🏭",
  },
]

export default function SectionNetwork() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 4 })
    }
  }, [inView])

  return (
    <section
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            The <span className="gradient-text">DONNA to DONNA Network</span>
          </h2>
          <p className="text-foreground/60 max-w-3xl mx-auto text-lg mb-8">
            DONNA works as a digital employee inside your business. As you grow, DONNAs securely coordinate with other DONNAs across teams, locations, or businesses—reducing manual handoffs and expanding your network.
          </p>
        </div>

        <div
          ref={railRef}
          className="hRail flex gap-4 overflow-x-auto pb-4 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {networkUseCases.map((useCase, index) => (
            <div
              key={index}
              className="hCard liquid-glass-card p-6 rounded-xl refract-on-hover flex-shrink-0 flex flex-col"
            >
              <div className="text-4xl mb-4 flex-shrink-0">{useCase.icon}</div>
              <h4 className="text-lg font-bold mb-3 text-foreground leading-tight flex-shrink-0">{useCase.title}</h4>
              <p className="text-xs text-foreground/80 leading-relaxed flex-grow overflow-hidden text-ellipsis line-clamp-6">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>

        <ScrollDots containerRef={railRef} itemCount={networkUseCases.length} />
      </div>
    </section>
  )
}

