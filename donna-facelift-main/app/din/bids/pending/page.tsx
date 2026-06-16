"use client"

import { motion } from "framer-motion"
import { Clock, Calendar } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"
import { BidStatusPill } from "@/components/din/bids/bid-status-pill"
import { TagPill } from "@/components/din/ui/tag-pill"
import { pendingBids } from "@/lib/din/mock-data/bids"

export default function PendingBidsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Pending Bids"
        subtitle="Bids submitted and awaiting a decision"
      />

      <div className="space-y-4">
        {pendingBids.map((bid) => (
          <GlowCard key={bid.id} glowColor="cyan" className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-medium text-white">{bid.title}</h3>
                  <BidStatusPill status={bid.status} />
                </div>
                <p className="text-xs text-white/40 mb-3">{bid.category}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {bid.skills.map((s) => (
                    <TagPill key={s}>{s}</TagPill>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Submitted {bid.submittedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400/70" />
                    <span className="text-cyan-400/70">{bid.timeRemaining}</span>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-white/60">
                  Bid: ${bid.submittedAmount?.toLocaleString()}
                </p>
                <p className="text-xs text-white/35 mt-0.5">
                  Range: ${bid.budgetMin.toLocaleString()} – ${bid.budgetMax.toLocaleString()}
                </p>
                {bid.fitScore && (
                  <p className="text-sm text-emerald-400/70 mt-2">{bid.fitScore}% fit</p>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </motion.div>
  )
}
