import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "What is DONNA",
  description:
    "DONNA is operational intelligence for real estate, connecting communication, coordination, knowledge, and governed action inside a business.",
  path: "/what-is-donna",
})

export default function WhatIsDonnaPage() {
  return (
    <MarketingSubpageShell
      title="What is DONNA?"
      lead="Operational intelligence inside the business, and the foundation for an operating network across real estate."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          DONNA connects business context to governed action. Depending on workspace configuration, it can work
          across email, calendars, contacts, leads, SMS, voice, Slack, knowledge sources, files, and productivity
          artifacts.
        </p>
        <p>
          Live capabilities are available in the product today; integrations and actions vary by permissions, data,
          connector health, and deployment setup. Broader transaction orchestration and cross-business DIN workflows
          remain roadmap and vision capabilities unless separately confirmed.
        </p>
        <p>
          Read more in the{" "}
          <Link href="/faq" className="text-accent hover:underline">
            FAQ
          </Link>
          , follow the{" "}
          <Link href="/getting-started" className="text-accent hover:underline">
            real-estate setup guide
          </Link>
          , explore the{" "}
          <Link href="/donna-intelligence-network" className="text-accent hover:underline">
            DONNA Intelligence Network
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
