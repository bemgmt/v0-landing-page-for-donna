import { GlowCard } from "@/components/din/ui/glow-card"
import type { ProfileMetric } from "@/lib/din/types"

interface ProfileMetricsCardProps {
  metrics: ProfileMetric[]
}

export function ProfileMetricsCard({ metrics }: ProfileMetricsCardProps) {
  return (
    <GlowCard className="p-6">
      <h3 className="text-sm font-medium text-white/70 mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">{metric.label}</p>
            <p className="text-lg font-light text-white">{metric.value}</p>
            {metric.description && (
              <p className="text-[10px] text-white/25 mt-0.5">{metric.description}</p>
            )}
          </div>
        ))}
      </div>
    </GlowCard>
  )
}
