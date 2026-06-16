import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimerPillProps {
  time: string
  urgent?: boolean
}

export function TimerPill({ time, urgent }: TimerPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium",
        urgent
          ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
          : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/15"
      )}
    >
      <Clock className="w-3 h-3" />
      <span>{time}</span>
    </div>
  )
}
