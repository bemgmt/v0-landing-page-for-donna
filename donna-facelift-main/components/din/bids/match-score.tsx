import { cn } from "@/lib/utils"

interface MatchScoreProps {
  score: number
}

export function MatchScore({ score }: MatchScoreProps) {
  const getColor = () => {
    if (score >= 85) return "text-emerald-400"
    if (score >= 70) return "text-cyan-300"
    return "text-white/50"
  }

  const getLabel = () => {
    if (score >= 85) return "Strong match"
    if (score >= 70) return "Good match"
    return "Fair match"
  }

  return (
    <div className="text-right">
      <span className={cn("text-lg font-light", getColor())}>{score}%</span>
      <span className="block text-[9px] text-white/35 uppercase tracking-wider">{getLabel()}</span>
    </div>
  )
}
