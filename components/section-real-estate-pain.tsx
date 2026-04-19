"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

export default function SectionRealEstatePain() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 2 })
    }
  }, [inView])

  return (
    <section
      id="follow-through-problem"
      ref={ref}
      className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            Real estate reality
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
            Real estate doesn&apos;t have a lead problem.
            <br />
            <span className="text-foreground/90">It has a follow-through problem.</span>
          </h2>
        </div>
        <div className="space-y-6 text-base sm:text-lg text-foreground/80 leading-relaxed">
          <p>A lead comes in.</p>
          <p>Someone responds.</p>
          <p>Then it sits.</p>
          <p className="pt-2">A deal starts moving.</p>
          <p>Then communication breaks.</p>
          <p className="pt-2">
            Agents, lenders, title, inspectors are all working… but not together.
          </p>
          <p className="pt-4 font-semibold text-foreground">The result?</p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/75">
            <li>Missed follow-ups</li>
            <li>Slower closings</li>
            <li>Lost referrals</li>
            <li>Burned opportunities</li>
          </ul>
          <p className="pt-4 text-foreground/85">Not because people aren&apos;t working.</p>
          <p className="font-medium text-foreground">
            Because there&apos;s no system coordinating them.
          </p>
        </div>
      </div>
    </section>
  )
}
