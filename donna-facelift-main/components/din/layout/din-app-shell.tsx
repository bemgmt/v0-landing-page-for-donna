"use client"

import { DinSidebar } from "./din-sidebar"
import { DinTopbar } from "./din-topbar"
import { useInvestorPreviewOptional } from "@/contexts/InvestorPreviewContext"
import { InvestorReadonlyShell } from "@/components/investor/investor-readonly-shell"

interface DinAppShellProps {
  children: React.ReactNode
}

export function DinAppShell({ children }: DinAppShellProps) {
  const investor = useInvestorPreviewOptional()

  return (
    <div className="min-h-screen">
      <DinSidebar />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <DinTopbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col min-h-0">
          <InvestorReadonlyShell active={Boolean(investor?.isInvestorPreview)}>
            {children}
          </InvestorReadonlyShell>
        </main>
      </div>
    </div>
  )
}
