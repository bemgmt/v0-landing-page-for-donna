import { cn } from "@/lib/utils"

interface DinLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
}

export function DinLogo({ size = "md", className }: DinLogoProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center font-bold text-[#0C0F16]",
        sizes[size],
        className
      )}
    >
      D
    </div>
  )
}
