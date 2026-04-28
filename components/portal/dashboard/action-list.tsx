import Link from "next/link"

export type ActionItem = {
  title: string
  description?: string
  href: string
  external?: boolean
}

type Props = {
  title: string
  items: ActionItem[]
}

export function ActionList({ title, items }: Props) {
  return (
    <section className="rounded-xl border border-white/10 liquid-glass overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="divide-y divide-white/10">
        {items.map((item) => (
          <li key={item.href + item.title}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-0.5 px-4 py-3 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm font-medium text-cyan-300">{item.title}</span>
                {item.description ? (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                ) : null}
              </a>
            ) : (
              <Link
                href={item.href}
                className="flex flex-col gap-0.5 px-4 py-3 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm font-medium text-cyan-300">{item.title}</span>
                {item.description ? (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                ) : null}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
