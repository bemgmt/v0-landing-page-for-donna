import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Mortgage LO Automation & Pipeline Coordination AI",
  description:
    "AI pipeline coordination and LO automation software — manage document chase and borrower communication in one execution layer.",
  path: "/industries/mortgage",
})

export default function MortgageIndustryPage() {
  return (
    <MarketingSubpageShell
      title="Mortgage LO Automation & Pipeline Coordination AI"
      lead="Reduce friction between LOs, processors, underwriters, and partners with coordinated communication and task execution."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          DONNA is built for high-stakes workflows where timing and clarity matter. It helps teams stay aligned on
          conditions, disclosures, and follow-ups without relying on ad hoc email threads alone.
        </p>
        <p>
          <Link href="/contact" className="text-accent hover:underline">
            Contact us
          </Link>{" "}
          for vertical-specific onboarding, or return to the{" "}
          <Link href="/" className="text-accent hover:underline">
            homepage
          </Link>
          .
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
