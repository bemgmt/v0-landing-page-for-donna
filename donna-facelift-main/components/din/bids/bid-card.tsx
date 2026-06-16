import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BidItem } from "@/lib/din/types"
import { TimerPill } from "./timer-pill"
import { MatchScore } from "./match-score"
import { TagPill } from "@/components/din/ui/tag-pill"

interface BidCardProps {
  bid: BidItem
}

export function BidCard({ bid }: BidCardProps) {
  const isClosingSoon = bid.status === "closing-soon" || bid.timeRemaining.includes("01h") || bid.timeRemaining.includes("00h")

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-white/[0.025] backdrop-blur-sm p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:bg-white/[0.04]",
        isClosingSoon
          ? "border-amber-500/15 hover:border-amber-500/25 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]"
          : "border-white/[0.07] hover:border-cyan-500/15 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)]"
      )}
    >
      {bid.locked && (
        <div className="absolute top-3.5 right-3.5 text-white/20">
          <Lock className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white/90 leading-snug truncate pr-6">
            {bid.title}
          </h3>
          <p className="text-xs text-white/35 mt-0.5">{bid.category}</p>
        </div>
      </div>

      <p className="text-sm text-white/60 mb-3">
        Budget: ${bid.budgetMin.toLocaleString()} - ${bid.budgetMax.toLocaleString()}
      </p>

      <div className="flex items-center justify-between mb-3">
        <TimerPill time={bid.timeRemaining} urgent={isClosingSoon} />
        {bid.fitScore && <MatchScore score={bid.fitScore} />}
      </div>

      {bid.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {bid.skills.slice(0, 3).map((skill) => (
            <TagPill key={skill}>{skill}</TagPill>
          ))}
          {bid.skills.length > 3 && (
            <TagPill>+{bid.skills.length - 3}</TagPill>
          )}
        </div>
      )}

      {bid.location && (
        <p className="text-[10px] text-white/25 mt-3">{bid.location}</p>
      )}
    </div>
  )
}
