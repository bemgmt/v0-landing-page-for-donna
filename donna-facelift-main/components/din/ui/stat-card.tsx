import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ label, value, change, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15">
      <p className="text-[11px] uppercase tracking-wider text-white/40 font-medium mb-2">{label}</p>
      <p className="text-2xl font-light text-white">{value}</p>
      {change && (
        <div className="flex items-center gap-1 mt-2">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
          {trend === "neutral" && <Minus className="w-3 h-3 text-white/40" />}
          <span
            className={cn(
              "text-xs",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400",
              trend === "neutral" && "text-white/40"
            )}
          >
            {change}
          </span>
        </div>
      )}
    </div>
  )
}
