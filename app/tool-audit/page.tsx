import type { Metadata } from "next"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import ToolStackAudit from "@/components/tool-stack-audit"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Software Tool Stack Cost Audit & ROI Calculator",
  description: "Calculate the true cost of your fragmented software stack. Discover the hidden costs of integrating CRMs, transaction coordinators, and dispatch software.",
  path: "/tool-audit",
})

export default function ToolAuditPage() {
  return (
    <MarketingSubpageShell
      title="Tool Stack Audit & ROI"
      lead="Calculate the true operational cost of a fragmented software stack — and see how unifying execution with DONNA impacts your bottom line."
    >
      <div className="pt-8">
        <ToolStackAudit />
      </div>
    </MarketingSubpageShell>
  )
}
