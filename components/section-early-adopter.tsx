"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"

export default function SectionEarlyAdopter() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 9 })
    }
  }, [inView])

  const benefits = [
    "Direct influence on how DONNA evolves",
    "Priority onboarding and support",
    "Locked-in pricing advantages",
    "First access to the DONNA Intelligence Network",
  ]

  return (
    <section ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            Early adopter advantage
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow">
            Early adopters win here
          </h2>
        </div>
        <p className="text-base sm:text-lg text-foreground/80 text-center md:text-left">
          You&apos;re not just buying access.
        </p>
        <p className="font-medium text-foreground text-center md:text-left">You&apos;re getting:</p>
        <ul className="grid gap-3 sm:gap-4 max-w-2xl mx-auto md:mx-0">
          {benefits.map((item) => (
            <li
              key={item}
              className="flex gap-3 items-start text-base sm:text-lg text-foreground/85"
            >
              <span className="text-accent mt-1 shrink-0" aria-hidden>
                ✔
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-center md:text-left text-base sm:text-lg text-foreground/75 pt-2">
          As the system grows, so does your leverage.
        </p>
      </div>
    </section>
  )
}
