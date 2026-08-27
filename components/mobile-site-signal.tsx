"use client"

import { useEffect, useRef, useState } from "react"

const signalStages = [
  { id: "top", label: "Arrival" },
  { id: "network-problem", label: "The problem" },
  { id: "network", label: "DONNA + DIN" },
  { id: "connected-transaction", label: "Transaction" },
  { id: "network-value", label: "Network value" },
  { id: "product", label: "The product" },
  { id: "associations", label: "Partners" },
  { id: "trust", label: "Trust" },
  { id: "early-access", label: "Early access" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "Questions" },
  { id: "demo-form", label: "Connect" },
]

export default function MobileSiteSignal() {
  const [activeIndex, setActiveIndex] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0

    const updateProgress = () => {
      frame = 0
      const scrollTop = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop)
      const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
      const scrollableDistance = pageHeight - window.innerHeight
      const progress = scrollableDistance > 0 ? Math.min(1, Math.max(0, scrollTop / scrollableDistance)) : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleY(${progress})`
    }

    const handleScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateProgress)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = signalStages.findIndex(({ id }) => id === entry.target.id)
          if (index >= 0) setActiveIndex(index)
        }
      },
      { rootMargin: "-46% 0px -46% 0px", threshold: 0 },
    )

    for (const { id } of signalStages) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }

    updateProgress()
    window.addEventListener("scroll", handleScroll, { passive: true })
    document.body.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
      document.body.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const currentStage = signalStages[activeIndex]
  const stageNumber = String(activeIndex + 1).padStart(2, "0")
  const stageTotal = String(signalStages.length).padStart(2, "0")

  const scrollToStage = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="md:hidden" aria-label="Page progress">
      <div className="pointer-events-none fixed inset-0 z-[35] overflow-hidden" aria-hidden>
        <div className="absolute -right-24 top-[16%] h-56 w-56 rounded-full bg-accent/[0.035] blur-3xl" />
        <div className="absolute -left-28 top-[58%] h-64 w-64 rounded-full bg-primary/[0.035] blur-3xl" />
        <div key={activeIndex} className="mobile-signal-sweep absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
      </div>

      <div className="pointer-events-none fixed right-3 top-20 z-[70] flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-foreground/55 shadow-lg shadow-black/30 backdrop-blur-xl">
        <span className="text-accent">{stageNumber}/{stageTotal}</span>
        <span className="max-w-24 truncate">{currentStage.label}</span>
      </div>

      <nav className="pointer-events-none fixed bottom-24 right-2.5 top-32 z-[65] flex w-5 items-center justify-center" aria-label="Homepage sections">
        <div className="relative flex h-full w-full flex-col items-center justify-between py-2">
          <div className="absolute bottom-2 top-2 w-px bg-white/10" aria-hidden>
            <div
              ref={progressRef}
              className="h-full w-px origin-top bg-gradient-to-b from-accent via-accent to-primary shadow-[0_0_10px_var(--color-accent)] will-change-transform"
              style={{ transform: "scaleY(0)" }}
            />
          </div>

          {signalStages.map(({ id, label }, index) => {
            const isActive = activeIndex === index

            return (
              <button
                key={id}
                type="button"
                onClick={() => scrollToStage(id)}
                className={`pointer-events-auto relative z-10 flex h-4 w-4 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none ${isActive ? "scale-125" : "hover:scale-110"}`}
                aria-label={`Scroll to ${label}`}
                aria-current={isActive ? "location" : undefined}
              >
                {isActive ? <span className="absolute inset-0 rounded-full border border-accent/45 shadow-[0_0_14px_var(--color-accent)] motion-safe:animate-ping" aria-hidden /> : null}
                <span className={`relative h-1.5 w-1.5 rounded-full border transition-colors duration-300 ${isActive ? "border-accent bg-accent" : index < activeIndex ? "border-accent/60 bg-accent/50" : "border-white/30 bg-black"}`} aria-hidden />
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
