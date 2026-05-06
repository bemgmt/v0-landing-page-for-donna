"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import Image from "next/image"

export default function SectionNetwork() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 6 })
    }
  }, [inView])

  return (
    <section id="intelligence-network" ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="order-2 lg:order-1 flex items-center justify-center">
          <div className="w-full relative rounded-2xl border border-white/10 bg-white/[0.02] p-2 sm:p-4 shadow-2xl overflow-hidden wow-card">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent opacity-50" />
            <div className="relative rounded-xl overflow-hidden border border-white/5 bg-background">
              <Image 
                src="/DINscreenshot.png"
                alt="DONNA Intelligence Network Interface"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 space-y-5">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            DONNA Intelligence Network
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow">
            The more DONNAs, the more powerful it gets
          </h2>
          <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
            As each DONNA learns, that intelligence compounds across the network. As more connecting
            companies run DONNA, they can expedite co-working projects and even refer leads to each
            other.
          </p>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            DONNA never shares your data — just{" "}
            <strong className="text-foreground font-semibold">
              the patterns that make deals move faster.
            </strong>
          </p>
          <p className="text-base sm:text-lg font-medium text-foreground pt-2">
            Every new business makes every other business better.
          </p>
        </div>
      </div>
    </section>
  )
}
