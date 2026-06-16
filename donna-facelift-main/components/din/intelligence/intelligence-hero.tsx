import { TrendingUp } from "lucide-react"

export function IntelligenceHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.04] via-transparent to-cyan-500/[0.04] p-8 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-violet-400/70" />
        <span className="text-[10px] uppercase tracking-wider text-violet-400/80 font-medium">
          Intelligence Feed
        </span>
      </div>
      <h1 className="text-2xl font-light text-white mb-2">DIN Intelligence</h1>
      <p className="text-sm text-white/45 max-w-lg leading-relaxed">
        Market signals, skill trends, and network observations from the DONNA Intelligence Network.
        Data refreshed continuously from active network activity.
      </p>
    </div>
  )
}
