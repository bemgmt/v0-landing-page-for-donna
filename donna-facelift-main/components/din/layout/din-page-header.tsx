interface DinPageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function DinPageHeader({ title, subtitle, children }: DinPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-white/50 mt-1">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
