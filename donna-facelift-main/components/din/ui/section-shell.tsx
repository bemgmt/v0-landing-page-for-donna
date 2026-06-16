import { cn } from "@/lib/utils"

interface SectionShellProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function SectionShell({ title, subtitle, children, className }: SectionShellProps) {
  return (
    <section className={cn("mb-8", className)}>
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-light text-white/90">{title}</h2>
          {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
