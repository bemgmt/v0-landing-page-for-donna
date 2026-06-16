"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, DollarSign } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"
import { BidStatusPill } from "@/components/din/bids/bid-status-pill"
import { TagPill } from "@/components/din/ui/tag-pill"
import { previousBids } from "@/lib/din/mock-data/bids"
import { cn } from "@/lib/utils"

const filters: { label: string; value: "all" | "won" | "lost" }[] = [
  { label: "All", value: "all" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
]

export default function PreviousBidsPage() {
  const [filter, setFilter] = useState<"all" | "won" | "lost">("all")

  const filtered = previousBids.filter((bid) => {
    if (filter === "all") return true
    return bid.status === filter
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader title="Previous Bids" subtitle="Review past bid outcomes" />

      <div className="flex items-center gap-1 mb-6 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06] w-fit">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm transition-all",
              filter === f.value
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((bid) => (
          <GlowCard
            key={bid.id}
            glowColor={bid.status === "won" ? "emerald" : "default"}
            className="p-5"
          >
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
                    Decision: {bid.decisionDate}
                  </span>
                  {bid.fitScore && (
                    <span>{bid.fitScore}% fit</span>
                  )}
                </div>
                {bid.note && (
                  <p className="text-xs text-white/30 mt-2 italic">{bid.note}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-white/60">
                  Bid: ${bid.submittedAmount?.toLocaleString()}
                </p>
                {bid.projectValue && (
                  <p className="text-xs text-emerald-400/60 mt-1 flex items-center gap-1 justify-end">
                    <DollarSign className="w-3 h-3" />
                    Project value: ${bid.projectValue.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </motion.div>
  )
}
