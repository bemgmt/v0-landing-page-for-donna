import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { activeBidsPreview } from "@/lib/din/mock-data/dashboard"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"

export function ActiveBidsPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-light text-white/90">Active Bids</h2>
        <Link
          href="/din/bids/pending"
          className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {activeBidsPreview.map((bid) => (
          <GlowCard key={bid.id} glowColor="cyan" className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{bid.title}</h3>
                <p className="text-xs text-white/40 mt-0.5">{bid.category}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bid.skills.slice(0, 3).map((s) => (
                    <TagPill key={s}>{s}</TagPill>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-white/70">
                  ${bid.budgetMin.toLocaleString()} – ${bid.budgetMax.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Clock className="w-3 h-3 text-cyan-400/70" />
                  <span className="text-xs text-cyan-400/70">{bid.timeRemaining}</span>
                </div>
                {bid.fitScore && (
                  <p className="text-[10px] text-emerald-400/70 mt-1">{bid.fitScore}% fit</p>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}
