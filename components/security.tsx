"use client"

import { useInView } from "react-intersection-observer"

const trustStatements = [
  "Built for real businesses",
  "Designed for scale",
  "Secure, modular, enterprise-grade",
  "Human-in-the-loop by design",
  "Built natively on AWS",
  "Planned availability on the Amazon Marketplace by launch",
]

export default function Security() {
  const { ref } = useInView({ threshold: 0.2, once: true })

  return (
    <section id="trust" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
          Trust & positioning
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6">
          Infrastructure first. Features second.
        </h2>
        <div className="space-y-3 text-base sm:text-lg text-foreground/75">
          {trustStatements.map((statement) => (
            <p key={statement}>{statement}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
