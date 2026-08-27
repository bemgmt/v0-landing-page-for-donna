"use client"

import { Search, ShieldCheck, Sparkles, Workflow } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const networkPrinciples = [
  {
    title: "Coordinate",
    body: "Create clearer requests, handoffs, milestones, and next steps across participating businesses.",
    status: "Network roadmap",
    Icon: Workflow,
  },
  {
    title: "Discover",
    body: "Help real-estate businesses identify relevant participating providers when work needs to move.",
    status: "Long-term vision",
    Icon: Search,
  },
  {
    title: "Learn",
    body: "Develop governed, privacy-preserving patterns about delays, bottlenecks, and better operating practices.",
    status: "Long-term vision",
    Icon: Sparkles,
  },
  {
    title: "Govern",
    body: "Keep permissions, confirmations, professional judgment, and accountability with the people responsible.",
    status: "Product principle",
    Icon: ShieldCheck,
  },
]

export default function NetworkSignalRail() {
  const [activeIndex, setActiveIndex] = useState(0)
  const stepRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number((entry.target as HTMLElement).dataset.networkStep)
          if (Number.isInteger(index)) setActiveIndex(index)
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    )

    const steps = stepRefs.current
    for (const step of steps) {
      if (step) observer.observe(step)
    }

    return () => observer.disconnect()
  }, [])

  const progress = networkPrinciples.length > 1 ? (activeIndex / (networkPrinciples.length - 1)) * 100 : 0

  return (
    <section id="network-value" className="relative border-t border-white/5 bg-white/[0.015] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="hidden md:block">
          <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-foreground/55">How the network creates value</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {networkPrinciples.map(({ title, body, status, Icon }, index) => (
              <div key={title} className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <span className="font-mono text-xs tracking-[0.2em] text-foreground/30">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">{body}</p>
                <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary">{status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:hidden">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/55">How the network creates value</p>
            <div className="mt-4 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-accent/75">
              <span>Scroll the signal</span>
              <span className="h-px flex-1 bg-gradient-to-r from-accent/55 to-transparent" aria-hidden />
            </div>
          </div>

          <div className="relative pl-12">
            <div className="absolute bottom-[21svh] left-[0.95rem] top-[21svh] w-px bg-white/10" aria-hidden>
              <div
                className="w-px bg-gradient-to-b from-accent via-accent to-primary shadow-[0_0_12px_var(--color-accent)] transition-[height] duration-700 ease-out motion-reduce:transition-none"
                style={{ height: `${progress}%` }}
              />
            </div>

            {networkPrinciples.map(({ title, body, status, Icon }, index) => {
              const isActive = activeIndex === index

              return (
                <article
                  key={title}
                  ref={(element) => { stepRefs.current[index] = element }}
                  data-network-step={index}
                  data-active={isActive ? "true" : "false"}
                  aria-current={isActive ? "step" : undefined}
                  className="relative flex min-h-[42svh] items-center"
                >
                  <div
                    className={`absolute -left-[2.55rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-500 motion-reduce:transition-none ${
                      isActive
                        ? "border-accent bg-accent/15 shadow-[0_0_0_5px_rgba(57,213,255,0.08),0_0_24px_rgba(57,213,255,0.72)]"
                        : "border-white/20 bg-black"
                    }`}
                    aria-hidden
                  >
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${isActive ? "bg-accent" : "bg-white/25"}`} />
                  </div>

                  <div
                    className={`w-full rounded-2xl border p-5 backdrop-blur-md transition-all duration-500 motion-reduce:transform-none motion-reduce:transition-none ${
                      isActive
                        ? "translate-x-0 border-accent/35 bg-gradient-to-br from-accent/[0.09] via-white/[0.04] to-primary/[0.08] opacity-100 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                        : "translate-x-2 border-white/10 bg-white/[0.02] opacity-45"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-500 ${isActive ? "border-accent/35 bg-accent/10" : "border-white/10 bg-white/[0.03]"}`}>
                        <Icon className={`h-5 w-5 transition-colors duration-500 ${isActive ? "text-accent" : "text-foreground/35"}`} aria-hidden />
                      </div>
                      <span className="font-mono text-[0.62rem] tracking-[0.2em] text-foreground/35">0{index + 1}</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/65">{body}</p>
                    <p className={`mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-500 ${isActive ? "text-primary" : "text-foreground/35"}`}>
                      {status}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
