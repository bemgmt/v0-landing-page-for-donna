import Link from "next/link"
import { ArrowRight, CheckCircle, Zap } from "lucide-react"
import { suggestedMatchesPreview } from "@/lib/din/mock-data/dashboard"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"

export function SuggestedMatchesPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-light text-white/90">Suggested Matches</h2>
        <Link
          href="/din/needs/suggested-matches"
          className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {suggestedMatchesPreview.map((match) => (
          <GlowCard key={match.id} glowColor="violet" className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">{match.companyName}</h3>
                  {match.verified && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{match.industry}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {match.tags.map((tag) => (
                    <TagPill key={tag} variant="emerald">{tag}</TagPill>
                  ))}
                </div>
                <p className="text-xs text-white/35 mt-2">{match.whyMatch}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-light text-white">{match.fitScore}%</p>
                <p className="text-[10px] text-white/40">fit score</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Zap className="w-3 h-3 text-amber-400/70" />
                  <span className="text-[10px] text-amber-400/70">{match.responseSpeed}</span>
                </div>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}
