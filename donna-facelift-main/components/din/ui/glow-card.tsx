import { cn } from "@/lib/utils"

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: "cyan" | "violet" | "amber" | "emerald" | "default"
  hover?: boolean
}

const glowStyles = {
  cyan: "hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]",
  violet: "hover:border-violet-500/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]",
  amber: "hover:border-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]",
  emerald: "hover:border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]",
  default: "hover:border-white/15 hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]",
}

export function GlowCard({ children, className, glowColor = "default", hover = true }: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 transition-all duration-200",
        hover && glowStyles[glowColor],
        hover && "hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  )
}
