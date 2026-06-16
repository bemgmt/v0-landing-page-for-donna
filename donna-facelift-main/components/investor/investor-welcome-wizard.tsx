"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"

const FOUNDERS_EMAIL =
  process.env.NEXT_PUBLIC_INVESTOR_FOUNDERS_EMAIL || "founders@donna.ai"
/** Google Calendar appointment schedule URL (Appointment schedules). Legacy Calendly env still supported. */
const SCHEDULE_URL =
  process.env.NEXT_PUBLIC_INVESTOR_GOOGLE_CALENDAR_URL ||
  process.env.NEXT_PUBLIC_INVESTOR_CALENDLY_URL ||
  ""

const STEPS = [
  {
    title: "Welcome, investor",
    body: (
      <>
        <p className="text-white/90 leading-relaxed">
          You are viewing a curated peek at the <strong className="text-white">DONNA</strong>{" "}
          platform. Explore the layout and flows at your own pace—nothing here connects to a
          production tenant.
        </p>
        <p className="text-white/75 mt-3 text-sm leading-relaxed">
          This interface is <strong className="text-white">legacy</strong> compared to the tools
          shipping in the live product; use it to understand the vision, not feature parity.
        </p>
      </>
    ),
  },
  {
    title: "Ask DONNA in the chatbot",
    body: (
      <>
        <p className="text-white/90 leading-relaxed">
          Use the <strong className="text-cyan-300">floating DONNA assistant</strong>{" "}
          <MessageCircle className="inline w-4 h-4 text-cyan-300 align-text-bottom" /> in the
          lower-right corner. Ask in plain language about{" "}
          <strong className="text-white">capabilities</strong>,{" "}
          <strong className="text-white">financing</strong>, <strong className="text-white">GTM</strong>
          , <strong className="text-white">SAFE-style investments</strong>, or how the product fits
          your diligence—responses are conversational and demo-safe (no backend).
        </p>
      </>
    ),
  },
  {
    title: "Browse the modules",
    body: (
      <>
        <p className="text-white/90 leading-relaxed">
          Open tiles on the dashboard to see sales, marketing, analytics, lead flow, and more.
          In this preview, modules are <strong className="text-white">read-only</strong> so you
          can look without changing data—except <strong className="text-white">Secretary</strong>
          , where actions are simulated for effect.
        </p>
      </>
    ),
  },
  {
    title: "DONNA Intelligence Network (DIN)",
    body: (
      <>
        <p className="text-white/90 leading-relaxed">
          Explore the{" "}
          <strong className="text-white inline-flex items-center gap-1">
            <Globe className="w-4 h-4 text-sky-300" />
            DONNA Intelligence Network (DIN)
          </strong>
          —a separate surface for intelligence, bids, and skills-style experiences. Use the header
          link <span className="text-white/80">“Access the DIN”</span> anytime, or open it below.
        </p>
        <div className="mt-4">
          <Link
            href="/din"
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200 border border-sky-400/40 rounded-lg px-4 py-2 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Open the DIN
          </Link>
        </div>
      </>
    ),
  },
  {
    title: "Live demo & founders",
    body: (
      <>
        <p className="text-white/90 leading-relaxed">
          This shell is an <strong className="text-white">older DONNA UI</strong>. For a{" "}
          <strong className="text-white">live demo</strong>, email the founders to request access:
          you will receive <strong className="text-white">login credentials</strong>, a{" "}
          <strong className="text-white">URL</strong>, and access to a functional DONNA instance.
        </p>
        <p className="text-white/80 mt-3 text-sm leading-relaxed">
          You can also book time with the founders on{" "}
          <strong className="text-white">Google Calendar</strong> to discuss{" "}
          <strong className="text-white">investment opportunities</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`mailto:${FOUNDERS_EMAIL}?subject=${encodeURIComponent("DONNA live demo request")}&body=${encodeURIComponent("Hello,\n\nI would like to request access to a live DONNA demo.\n\nThank you,")}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-white border border-white/30 rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
          >
            Email founders — demo access
          </a>
          {SCHEDULE_URL ? (
            <a
              href={SCHEDULE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 border border-emerald-400/40 rounded-lg px-4 py-2 hover:bg-emerald-500/10 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book time (Google Calendar)
            </a>
          ) : null}
        </div>
      </>
    ),
  },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function InvestorWelcomeWizard({ open, onClose }: Props) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) setStep(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (step === 1) {
      window.dispatchEvent(new CustomEvent("donna:open"))
    }
  }, [open, step])

  const last = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="investor-welcome-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="w-full max-w-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 md:p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">
                  Investor preview · {step + 1} / {STEPS.length}
                </p>
              </div>
              <h2
                id="investor-welcome-title"
                className="text-xl md:text-2xl font-light text-white mb-4"
              >
                {STEPS[step].title}
              </h2>
              <div className="text-sm md:text-base min-h-[180px]">{STEPS[step].body}</div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <NeonButton
                  type="button"
                  variant="glass"
                  size="sm"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </NeonButton>
                {last ? (
                  <NeonButton type="button" size="sm" onClick={onClose} className="gap-1">
                    Get started
                    <Sparkles className="w-4 h-4" />
                  </NeonButton>
                ) : (
                  <NeonButton
                    type="button"
                    size="sm"
                    onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </NeonButton>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
