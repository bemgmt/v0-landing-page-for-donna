import { dashboardStats } from "@/lib/din/mock-data/dashboard"
import { StatCard } from "@/components/din/ui/stat-card"

export function AnalyticsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {dashboardStats.map((stat) => (
        <StatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          trend={stat.trend}
        />
      ))}
    </div>
  )
}
