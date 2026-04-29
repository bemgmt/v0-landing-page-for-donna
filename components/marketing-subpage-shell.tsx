import type { ReactNode } from "react"
import { Breadcrumb } from "@/components/breadcrumb"

export function MarketingSubpageShell({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb />
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          {lead ? <p className="text-foreground/70 text-lg">{lead}</p> : null}
        </header>
        <div className="mt-10 max-w-4xl mx-auto space-y-6 text-foreground/85">{children}</div>
      </div>
    </div>
  )
}
