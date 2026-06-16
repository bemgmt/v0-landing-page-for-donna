"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"
import type { TrendItem } from "@/lib/din/types"

interface SkillCardProps {
  skill: TrendItem
  isOwned?: boolean
  onAdd?: (id: string) => void
}

const demandColors = {
  high: "emerald",
  medium: "cyan",
  low: "default",
} as const

export function SkillCard({ skill, isOwned = false, onAdd }: SkillCardProps) {
  const [added, setAdded] = useState(isOwned)

  const handleAdd = () => {
    if (added) return
    setAdded(true)
    onAdd?.(skill.id)
  }

  return (
    <GlowCard glowColor={demandColors[skill.demandSignal]} className="p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white leading-snug">{skill.title}</h3>
          <p className="text-[11px] text-white/35 mt-0.5">{skill.category}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {skill.trendDirection === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          {skill.trendDirection === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          {skill.trendDirection === "stable" && <Minus className="w-3.5 h-3.5 text-white/40" />}
          <span
            className={cn(
              "text-xs font-medium",
              skill.growthIndicator.startsWith("+") ? "text-emerald-400" : skill.growthIndicator.startsWith("-") ? "text-red-400" : "text-white/50"
            )}
          >
            {skill.growthIndicator}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <TagPill variant={demandColors[skill.demandSignal] === "emerald" ? "emerald" : demandColors[skill.demandSignal]}>
          {skill.demandSignal} demand
        </TagPill>
        <span className="text-[11px] text-white/30">{skill.relatedRequests} requests</span>
      </div>

      {skill.lastUpdated && (
        <p className="text-[10px] text-white/20 mb-3">Updated {skill.lastUpdated}</p>
      )}

      <div className="mt-auto pt-2">
        <button
          onClick={handleAdd}
          disabled={added}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            added
              ? "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/15 cursor-default"
              : "bg-white/[0.05] text-white/60 border border-white/[0.08] hover:bg-white/[0.1] hover:text-white hover:border-white/15"
          )}
        >
          {added ? (
            <>
              <Check className="w-3 h-3" />
              <span>Added to my skills</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Add to my skills</span>
            </>
          )}
        </button>
      </div>
    </GlowCard>
  )
}
