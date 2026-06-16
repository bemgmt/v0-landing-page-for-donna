import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "heavy" | "dark"
  hover?: boolean
}

function GlassCard({ 
  className, 
  variant = "default",
  hover = true,
  ...props 
}: GlassCardProps) {
  const variantClasses = {
    default: "glass",
    heavy: "glass-heavy",
    dark: "glass-dark"
  }

  return (
    <div
      className={cn(
        variantClasses[variant],
        hover && "donna-card",
        "rounded-xl",
        className
      )}
      {...props}
    />
  )
}

export { GlassCard }
