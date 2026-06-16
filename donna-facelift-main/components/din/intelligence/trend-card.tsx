import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"
import type { TrendItem } from "@/lib/din/types"

interface TrendCardProps {
  trend: TrendItem
  graphData?: number[]
}

const demandColors = {
  high: "emerald",
  medium: "cyan",
  low: "default",
} as const

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 200
  const height = 48
  const padding = 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (val - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const polyline = points.join(" ")

  const gradientId = `grad-${data.join("-")}`
  const areaPoints = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const sparklineColors: Record<string, string> = {
  emerald: "rgb(52, 211, 153)",
  cyan: "rgb(103, 232, 249)",
  default: "rgba(255, 255, 255, 0.3)",
}

export function TrendCard({ trend, graphData }: TrendCardProps) {
  const colorKey = demandColors[trend.demandSignal]

  return (
    <GlowCard glowColor={colorKey} className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-medium text-white">{trend.title}</h3>
          <p className="text-xs text-white/40 mt-0.5">{trend.category}</p>
        </div>
        <div className="flex items-center gap-1">
          {trend.trendDirection === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {trend.trendDirection === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
          {trend.trendDirection === "stable" && <Minus className="w-4 h-4 text-white/40" />}
          <span
            className={cn(
              "text-sm font-medium",
              trend.trendDirection === "up" && "text-emerald-400",
              trend.trendDirection === "down" && "text-red-400",
              (!trend.trendDirection || trend.trendDirection === "stable") && "text-white/50"
            )}
          >
            {trend.growthIndicator}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <TagPill variant={colorKey === "emerald" ? "emerald" : colorKey}>
          {trend.demandSignal} demand
        </TagPill>
        <span className="text-xs text-white/35">{trend.relatedRequests} requests</span>
      </div>

      {graphData && graphData.length > 1 && (
        <div className="mt-4 -mx-1">
          <Sparkline data={graphData} color={sparklineColors[colorKey] ?? sparklineColors.default} />
          <div className="flex justify-between text-[9px] text-white/20 mt-1 px-1">
            <span>6mo ago</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {!graphData && trend.lastUpdated && (
        <p className="text-[10px] text-white/25 mt-3">Updated {trend.lastUpdated}</p>
      )}
      {!graphData && trend.relatedCategories && trend.relatedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {trend.relatedCategories.map((cat) => (
            <TagPill key={cat}>{cat}</TagPill>
          ))}
        </div>
      )}
    </GlowCard>
  )
}
