import { cn } from "@/lib/utils"
import type { BidStatus } from "@/lib/din/types"

interface BidStatusPillProps {
  status: BidStatus
}

const statusStyles: Record<BidStatus, string> = {
  open: "bg-emerald-500/10 text-emerald-300 border-emerald-500/15",
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/15",
  won: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-400/70 border-red-500/15",
  "closing-soon": "bg-amber-500/15 text-amber-300 border-amber-500/20",
}

const statusLabels: Record<BidStatus, string> = {
  open: "Open",
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  "closing-soon": "Closing Soon",
}

export function BidStatusPill({ status }: BidStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
