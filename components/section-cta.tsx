"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

export default function SectionCTA() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 6 })
    }
  }, [inView])

  const handleScrollToForm = () => {
    const form = document.getElementById("demo-form")
    form?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="section-cta" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow">Join the private deployment.</h2>
        <p className="text-base sm:text-lg text-foreground/70">
          Help shape the operational layer your business will run on.
        </p>
        <button
          type="button"
          onClick={handleScrollToForm}
          className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-accent text-background font-semibold hover:bg-accent/90 transition-all"
        >
          Request Access
        </button>
      </div>
    </section>
  )
}

