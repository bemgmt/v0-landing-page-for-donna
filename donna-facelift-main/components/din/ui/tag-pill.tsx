import { cn } from "@/lib/utils"

interface TagPillProps {
  children: React.ReactNode
  variant?: "default" | "cyan" | "violet" | "amber" | "emerald"
  className?: string
}

const variants = {
  default: "bg-white/[0.06] text-white/60 border-white/[0.08]",
  cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/15",
  violet: "bg-violet-500/10 text-violet-300 border-violet-500/15",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/15",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/15",
}

export function TagPill({ children, variant = "default", className }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
