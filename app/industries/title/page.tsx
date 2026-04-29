import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA for title & escrow",
  description:
    "Coordination infrastructure for title and escrow — clearing tasks, partner communication, and closing readiness without dropped items.",
  path: "/industries/title",
})

export default function TitleIndustryPage() {
  return (
    <MarketingSubpageShell
      title="DONNA for title & escrow"
      lead="Keep lenders, agents, vendors, and signing parties aligned through a single operational layer."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          Title operations depend on hundreds of small handoffs. DONNA helps teams track requirements, chase
          outstanding items, and communicate status with less manual overhead.
        </p>
        <p>
          <Link href="/faq" className="text-accent hover:underline">
            FAQ
          </Link>{" "}
          ·{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
