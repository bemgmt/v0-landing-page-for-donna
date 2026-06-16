"use client"

import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TimerPill } from "@/components/din/bids/timer-pill"
import { TagPill } from "@/components/din/ui/tag-pill"
import { closingSoonBids } from "@/lib/din/mock-data/bids"

export default function ClosingSoonPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Closing Soon"
        subtitle="Opportunities closing within the next hour — act now"
      />

      <div className="space-y-4">
        {closingSoonBids.map((bid) => (
          <GlowCard
            key={bid.id}
            glowColor="amber"
            className="p-5 border-amber-500/10"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-white mb-1">{bid.title}</h3>
                <p className="text-xs text-white/40 mb-3">{bid.category}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {bid.skills.map((s) => (
                    <TagPill key={s}>{s}</TagPill>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <TimerPill time={bid.timeRemaining} urgent />
                  {bid.fitScore && (
                    <span className="text-xs text-emerald-400/70">{bid.fitScore}% fit</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-2">
                <p className="text-sm text-white/60">
                  ${bid.budgetMin.toLocaleString()} – ${bid.budgetMax.toLocaleString()}
                </p>
                {bid.recommendedAction && (
                  <div className="flex items-center gap-1.5 justify-end">
                    <AlertTriangle className="w-3 h-3 text-amber-400/70" />
                    <span className="text-xs text-amber-400/70">{bid.recommendedAction}</span>
                  </div>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </motion.div>
  )
}
