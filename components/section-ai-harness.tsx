"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

export default function SectionAIHarness() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 7 })
    }
  }, [inView])

  return (
    <section id="ai-harness" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
          AI harness
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
          AI is the engine.
          <br />
          DONNA is the system that makes it work.
        </h2>
        <div className="space-y-4 text-base sm:text-lg text-foreground/80 leading-relaxed">
          <p>Most businesses are duct-taped together with tools.</p>
          <p>That&apos;s why it feels fragmented.</p>
          <p className="pt-2 font-medium text-foreground">DONNA is different.</p>
          <p>
            DONNA replaces the gaps between your tools, then{" "}
            <strong className="text-foreground font-semibold">structures it into your business.</strong>
          </p>
          <p className="pt-6 border-t border-white/10 text-foreground/85">
            DONNA isn&apos;t another AI tool.
          </p>
          <p className="font-semibold text-foreground text-xl">It&apos;s the system your business runs on.</p>
        </div>
      </div>
    </section>
  )
}
