import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({ icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && <div className="text-white/20 mb-4">{icon}</div>}
      <h3 className="text-lg font-light text-white/60">{title}</h3>
      {description && <p className="text-sm text-white/35 mt-1 max-w-md">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
