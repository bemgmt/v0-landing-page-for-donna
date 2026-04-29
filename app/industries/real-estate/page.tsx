import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA for real estate",
  description:
    "AI operational infrastructure for brokerages and real estate operators — deal communication, coordination across agents, lenders, and title, without dropped handoffs.",
  path: "/industries/real-estate",
})

export default function RealEstateIndustryPage() {
  return (
    <MarketingSubpageShell
      title="DONNA for real estate"
      lead="One operational layer for listings, transactions, vendors, and client communication — built for brokerages and teams that cannot afford missed follow-ups."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          DONNA aligns agents, staff, and partners around the same timeline: offers, inspections, title, and closing
          tasks stay visible and executed. It is infrastructure for the deal — not a novelty chat window.
        </p>
        <p>
          Explore the{" "}
          <Link href="/" className="text-accent hover:underline">
            product overview
          </Link>
          ,{" "}
          <Link href="/donna-intelligence-network" className="text-accent hover:underline">
            Intelligence Network
          </Link>
          , or{" "}
          <Link href="/contact" className="text-accent hover:underline">
            request access
          </Link>
          .
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
