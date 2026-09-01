import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "AI Transaction Coordinator Software & Real Estate Automation",
  description:
    "AI transaction coordinator and operational infrastructure for brokerages — automate real estate workflows, deal communication, and coordination across agents, lenders, and title.",
  path: "/industries/real-estate",
})

export default function RealEstateIndustryPage() {
  return (
    <MarketingSubpageShell
      title="AI Transaction Coordinator & Real Estate Automation"
      lead="One operational layer for listings, transactions, vendors, and client communication — built for brokerages and teams that cannot afford missed follow-ups."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          DONNA aligns agents, staff, and partners around the same timeline: offers, inspections, title, and closing
          tasks stay visible and executed. It is infrastructure for the deal — not a novelty chat window.
        </p>
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
          <h2 className="text-xl font-semibold">How to get set up</h2>
          <p className="mt-2 text-foreground/70">
            Connect supported tools, teach DONNA how your business works, add your approved knowledge, choose your
            permission boundaries, and test the setup before expanding automation.
          </p>
          <Link href="/getting-started" className="mt-3 inline-flex min-h-11 items-center text-accent hover:underline">
            Follow the six-step getting-started guide →
          </Link>
        </div>
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
