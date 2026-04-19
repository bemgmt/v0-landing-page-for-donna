"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

export default function SectionReframe() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 3 })
    }
  }, [inView])

  return (
    <section ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5">
      <div className="max-w-4xl mx-auto space-y-6 text-center md:text-left">
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
          Reframe
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
          This isn&apos;t about AI.
          <br />
          It&apos;s about infrastructure.
        </h2>
        <div className="space-y-4 text-base sm:text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto md:mx-0">
          <p>Most AI tools help you write emails.</p>
          <p>
            DONNA automatically makes sure the right actions happen across your entire deal.
          </p>
          <p className="pt-2">
            It sits underneath your brokerage and coordinates agents, admins, vendors, and systems—
            so your business actually runs as one.
          </p>
        </div>
      </div>
    </section>
  )
}
