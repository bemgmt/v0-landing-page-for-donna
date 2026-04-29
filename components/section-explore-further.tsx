"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { pushDataLayer } from "@/lib/data-layer"

const NOTEBOOKLM_URL =
  "https://notebooklm.google.com/notebook/ef6a20e1-9bc3-402a-91f0-11f286c2c943"
const INVESTOR_DEMO_URL = "https://www.donna.business/"

const cards = [
  {
    title: "NotebookLM",
    description:
      "Ask questions, review curated material, and listen to podcasts about DONNA — all in one public notebook.",
    href: NOTEBOOKLM_URL,
    cta: "Open in NotebookLM",
  },
  {
    title: "Investor demo",
    description:
      "Explore an earlier prototype of DONNA’s interface and the DONNA Intelligence Network on our demo site.",
    href: INVESTOR_DEMO_URL,
    cta: "Visit donna.business",
  },
] as const

export default function SectionExploreFurther() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: 11 })
    }
  }, [inView])

  return (
    <section
      id="explore-further"
      ref={ref}
      className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">Further exploration</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold wow-glow leading-tight">
            Go deeper on DONNA
          </h2>
          <p className="text-base sm:text-lg text-foreground/75 max-w-2xl mx-auto leading-relaxed">
            Two places to learn more — outside links open in a new tab.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.href}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-5 flex flex-col gap-3 text-left"
            >
              <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
              <p className="text-sm text-foreground/75 leading-relaxed flex-1">{card.description}</p>
              <a
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  pushDataLayer({
                    event: "outbound_click",
                    link_url: card.href,
                    link_text: card.cta,
                  })
                }
                className="inline-flex items-center justify-center w-fit px-5 py-2.5 rounded-full bg-accent text-background text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                {card.cta}
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
