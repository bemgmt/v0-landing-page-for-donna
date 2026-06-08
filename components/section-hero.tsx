"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { onPricingCtaNavClick } from "@/lib/pricing-cta-nav"

export default function SectionHero() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 1 })
    }
  }, [inView])

  const handleScrollToNext = () => {
    const nextSection = document.getElementById("follow-through-problem")
    nextSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/intro/donna_intro_poster.jpg"
        >
          <source src="/intro/donna_intro_720p.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/80" />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.8)]" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10 pt-20 pb-12">
        <div className="absolute inset-x-0 -top-8 mx-auto h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-accent/20 blur-[120px] opacity-80 -z-10 pointer-events-none" />
        <p className="text-xs sm:text-sm tracking-[0.3em] text-foreground/60 uppercase mb-4">
          Real estate operations
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-5 animate-fade-in wow-glow leading-tight">
          The Operational Layer for Real Estate.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-foreground/80 mb-4 max-w-2xl mx-auto animate-slide-up px-2 leading-relaxed">
          DONNA is the neural infrastructure that unifies your communication, coordination, and execution into one continuous system.
        </p>
        <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground mb-8 px-2 animate-slide-up">
          Nothing gets missed. Everything moves.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/#pricing"
            onClick={(e) => onPricingCtaNavClick("hero_primary", e)}
            className="px-7 py-3 rounded-full animated-edge-button text-foreground hover:bg-white/20 transition-all duration-300 font-semibold text-base sm:text-lg refract-on-hover animate-slide-up relative z-10 inline-flex items-center justify-center"
            style={{ animationDelay: "200ms" }}
          >
            <span className="relative z-10">Deploy DONNA</span>
          </Link>
          <p className="text-xs sm:text-sm text-foreground/65 max-w-md px-2">
            No contracts. 30-day free trial. Early adopters lock in long-term advantages.
          </p>
          <button
            type="button"
            onClick={handleScrollToNext}
            className="text-xs sm:text-sm uppercase tracking-[0.35em] text-foreground/60 hover:text-foreground transition-colors"
          >
            Scroll to understand
          </button>
        </div>
      </div>
    </section>
  )
}
