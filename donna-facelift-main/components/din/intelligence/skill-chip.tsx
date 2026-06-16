import { cn } from "@/lib/utils"

interface SkillChipProps {
  name: string
  growth: string
  demand: "high" | "medium" | "low"
}

export function SkillChip({ name, growth, demand }: SkillChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all hover:-translate-y-0.5",
        demand === "high" && "bg-emerald-500/[0.06] border-emerald-500/15 text-white/80",
        demand === "medium" && "bg-cyan-500/[0.06] border-cyan-500/15 text-white/80",
        demand === "low" && "bg-white/[0.03] border-white/[0.08] text-white/60"
      )}
    >
      <span>{name}</span>
      <span
        className={cn(
          "text-xs font-medium",
          growth.startsWith("+") ? "text-emerald-400" : growth.startsWith("-") ? "text-red-400" : "text-white/40"
        )}
      >
        {growth}
      </span>
    </div>
  )
}
