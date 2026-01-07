"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import BackgroundAnimation from "@/components/background-animation"

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
      className="snapSection h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden"
    >
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto text-center relative z-10 pt-20">
        <div className="mb-4 animate-fade-in">
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/70 font-medium">Meet DONNA</p>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
          <span className="gradient-text">One AI. Every Industry.</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto animate-slide-up">
          Your digital employee layer that works across every business function
        </p>
        <button
          onClick={handleCTAClick}
          className="px-8 py-4 rounded-lg animated-edge-button text-foreground hover:bg-white/20 transition-all duration-300 font-semibold text-lg refract-on-hover animate-slide-up relative z-10"
          style={{ animationDelay: "200ms" }}
        >
          <span className="relative z-10">Join the Waitlist</span>
        </button>
      </div>
    </section>
  )
}

