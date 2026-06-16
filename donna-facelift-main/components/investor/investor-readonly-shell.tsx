"use client"

import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  /** When false, renders children only (no wrapper). */
  active: boolean
}

export function InvestorReadonlyShell({ active, children }: Props) {
  if (!active) return <>{children}</>
  return (
    <div className="relative min-h-0 flex-1 flex flex-col">
      <div
        className="pointer-events-none absolute left-1/2 top-3 z-[60] -translate-x-1/2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-100/90"
        aria-hidden
      >
        Investor preview — read-only
      </div>
      <div
        className="investor-readonly-root flex-1 min-h-0 overflow-y-auto pt-10"
        data-investor-readonly="true"
      >
        {children}
      </div>
    </div>
  )
}
