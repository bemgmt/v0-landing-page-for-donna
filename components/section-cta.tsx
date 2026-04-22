"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { onPricingCtaNavClick } from "@/lib/pricing-cta-nav"

export default function SectionCTA() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 10 })
    }
  }, [inView])

  return (
    <section id="section-cta" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow leading-tight">
          Real estate moves fast.
          <br />
          Your system should too.
        </h2>
        <p className="text-base sm:text-lg text-foreground/75 max-w-2xl mx-auto leading-relaxed">
          Stop relying on memory, manual work, and disconnected tools. Start running your business on a
          system.
        </p>
        <Link
          href="/#pricing"
          onClick={(e) => onPricingCtaNavClick("final_cta", e)}
          className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-accent text-background font-semibold hover:bg-accent/90 transition-all"
        >
          Get DONNA — $500/month
        </Link>
      </div>
    </section>
  )
}
