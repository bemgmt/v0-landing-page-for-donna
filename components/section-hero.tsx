"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

export default function SectionHero() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 1 })
    }
  }, [inView])

  const handleCTAClick = () => {
    track("cta_click_primary")
    const form = document.getElementById("section-cta")
    form?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={ref}
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
          <span className="gradient-text">One AI. Every Industry.</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto animate-slide-up">
          Your digital employee layer that works across every business function
        </p>
        <button
          onClick={handleCTAClick}
          className="px-8 py-4 rounded-lg bg-accent text-background hover:bg-accent/90 transition-all duration-300 font-semibold text-lg glow-accent hover:shadow-[0_0_30px_rgba(132,204,255,0.5)] animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          Join the Waitlist
        </button>
      </div>
    </section>
  )
}

