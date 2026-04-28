type Props = {
  title: string
  subtitle?: string
  eyebrow?: string
}

export function PageHeader({ title, subtitle, eyebrow }: Props) {
  return (
    <div className="space-y-1">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-widest text-cyan-400/80 font-medium">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl md:text-3xl font-semibold gradient-text">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p> : null}
    </div>
  )
}
