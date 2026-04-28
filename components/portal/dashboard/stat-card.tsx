import Link from "next/link"

type Props = {
  label: string
  value: string
  hint?: string
  delta?: string
  href?: string
}

export function StatCard({ label, value, hint, delta, href }: Props) {
  const inner = (
    <>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        {delta ? (
          <span className="text-xs font-medium text-emerald-400/90 whitespace-nowrap">{delta}</span>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground mt-2">{hint}</p> : null}
    </>
  )

  const className =
    "rounded-xl border border-white/10 liquid-glass p-4 transition-colors" +
    (href ? " hover:border-cyan-400/35 block" : "")

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    )
  }

  return <div className={className}>{inner}</div>
}
