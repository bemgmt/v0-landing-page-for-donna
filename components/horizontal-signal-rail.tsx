"use client"

import {
  Building2,
  FileCheck2,
  Landmark,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

const transactionItems = [
  { title: "Agent", body: "Relationship and representation", Icon: Users2 },
  { title: "Lender", body: "Financing milestones", Icon: Landmark },
  { title: "Escrow + title", body: "Documents and dependencies", Icon: FileCheck2 },
  { title: "Inspection", body: "Scheduling and findings", Icon: Search },
  { title: "Insurance + vendors", body: "Services and follow-through", Icon: Building2 },
]

const trustItems = [
  {
    title: "Human accountability",
    body: "People retain authority over judgment, fiduciary responsibilities, and consequential decisions.",
    Icon: UserRoundCheck,
  },
  {
    title: "Permissioned execution",
    body: "External actions follow workspace permissions, confirmation policies, and recipient resolution.",
    Icon: ShieldCheck,
  },
  {
    title: "Safer context handling",
    body: "Controls are designed to reduce prompt-injection risk from retrieved emails, documents, and websites.",
    Icon: Search,
  },
  {
    title: "Operational records",
    body: "Action and activity records support oversight; available audit views depend on the deployment.",
    Icon: FileCheck2,
  },
]

type HorizontalSignalRailProps = {
  variant: "transaction" | "trust"
}

export default function HorizontalSignalRail({ variant }: HorizontalSignalRailProps) {
  const items = variant === "transaction" ? transactionItems : trustItems
  const [activeIndex, setActiveIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const updateSignal = () => {
      const maxScroll = Math.max(rail.scrollWidth - rail.clientWidth, 0)
      const progress = maxScroll === 0 ? 1 : Math.min(Math.max(rail.scrollLeft / maxScroll, 0), 1)
      const firstCard = rail.querySelector<HTMLElement>("[data-signal-card]")
      const styles = window.getComputedStyle(rail)
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16
      const step = (firstCard?.offsetWidth ?? rail.clientWidth) + gap
      const nextIndex = Math.min(items.length - 1, Math.max(0, Math.round(rail.scrollLeft / step)))
      const nextComplete = maxScroll <= 1 || maxScroll - rail.scrollLeft <= 8

      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex))
      setIsComplete((current) => (current === nextComplete ? current : nextComplete))
      animationFrameRef.current = null
    }

    const scheduleUpdate = () => {
      if (animationFrameRef.current !== null) return
      animationFrameRef.current = window.requestAnimationFrame(updateSignal)
    }

    updateSignal()
    rail.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", scheduleUpdate)

    return () => {
      rail.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", scheduleUpdate)
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [items.length])

  const completeLabel = variant === "transaction" ? "Transaction connected" : "Trust framework connected"
  const instruction = variant === "transaction" ? "Swipe to connect the transaction" : "Swipe through the trust framework"

  return (
    <>
      <div className="md:hidden">
        <div className="mb-5 flex items-center justify-between gap-4 font-mono text-[0.62rem] uppercase tracking-[0.2em]">
          <span className={isComplete ? "text-accent" : "text-foreground/50"}>{isComplete ? completeLabel : instruction}</span>
          <span className="shrink-0 tabular-nums text-foreground/40">
            {isComplete ? "Linked" : `${String(activeIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}
          </span>
        </div>

        <div className="relative mb-5 flex items-center justify-between px-2" aria-hidden>
          <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/10">
            <div
              ref={fillRef}
              className="h-px origin-left scale-x-0 bg-gradient-to-r from-accent via-accent to-primary shadow-[0_0_14px_rgba(57,213,255,0.75)] motion-reduce:transition-none"
            />
          </div>
          {items.map(({ title }, index) => {
            const isLit = isComplete || activeIndex === index
            return (
              <span
                key={title}
                className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-background transition-all duration-500 motion-reduce:transition-none ${
                  isLit
                    ? "border-accent shadow-[0_0_0_4px_rgba(57,213,255,0.08),0_0_18px_rgba(57,213,255,0.7)]"
                    : "border-white/20"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLit ? "bg-accent" : "bg-white/20"}`} />
              </span>
            )
          })}
        </div>

        <div
          ref={railRef}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scroll-padding-inline:1rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-label={instruction}
          tabIndex={0}
        >
          {items.map(({ title, body, Icon }, index) => {
            const isLit = isComplete || activeIndex === index
            return (
              <article
                key={title}
                data-signal-card
                aria-current={!isComplete && activeIndex === index ? "step" : undefined}
                className={`min-w-[82%] snap-center rounded-2xl border p-6 transition-all duration-500 motion-reduce:transform-none motion-reduce:transition-none ${
                  isLit
                    ? "border-accent/35 bg-gradient-to-br from-accent/[0.09] via-white/[0.04] to-primary/[0.08] opacity-100 shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
                    : "border-white/10 bg-white/[0.02] opacity-45"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${isLit ? "border-accent/35 bg-accent/10" : "border-white/10 bg-white/[0.03]"}`}>
                    <Icon className={`h-5 w-5 ${isLit ? "text-accent" : "text-foreground/35"}`} aria-hidden />
                  </div>
                  <span className="font-mono text-[0.62rem] tracking-[0.2em] text-foreground/35">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">{body}</p>
              </article>
            )
          })}
          <div className="w-px shrink-0" aria-hidden />
        </div>

        <p className={`mt-1 text-center text-xs font-medium transition-colors duration-500 ${isComplete ? "text-accent" : "text-foreground/35"}`} aria-live="polite">
          {isComplete ? completeLabel : "Swipe horizontally to continue"}
        </p>
      </div>

      <div className={`relative hidden gap-6 md:grid ${variant === "transaction" ? "md:grid-cols-2 lg:grid-cols-5 lg:gap-4" : "md:grid-cols-2 lg:grid-cols-4"}`}>
        {variant === "transaction" ? (
          <div className="absolute left-[8%] right-[8%] top-8 hidden h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent lg:block" aria-hidden />
        ) : null}
        {items.map(({ title, body, Icon }, index) => (
          <div key={title} className={`relative rounded-2xl border border-white/10 p-6 ${variant === "transaction" ? "bg-black/40 lg:p-5" : "bg-white/[0.025]"}`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className={`flex items-center justify-center border border-accent/30 bg-accent/10 ${variant === "transaction" ? "h-12 w-12 rounded-full" : "h-11 w-11 rounded-xl"}`}>
                <Icon className="h-6 w-6 text-accent" aria-hidden />
              </div>
              {variant === "transaction" ? <span className="text-xs tabular-nums text-foreground/35">0{index + 1}</span> : null}
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">{body}</p>
          </div>
        ))}
      </div>
    </>
  )
}
