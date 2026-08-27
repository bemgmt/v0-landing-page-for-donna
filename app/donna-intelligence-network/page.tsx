import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA Intelligence Network",
  description:
    "The DONNA Intelligence Network is the long-term operating network for permissioned coordination and privacy-preserving intelligence across real estate.",
  path: "/donna-intelligence-network",
})

export default function DonnaIntelligenceNetworkPage() {
  return (
    <MarketingSubpageShell
      title="DONNA Intelligence Network (DIN)"
      lead="The network DONNA is building to help real-estate businesses coordinate without turning private customer data into an open shared pool."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          Today, DONNA provides operational capabilities inside a configured business workspace. DIN is the broader
          roadmap and long-term vision: permissioned coordination, provider discovery, and privacy-preserving patterns
          that help participating businesses work better together.
        </p>
        <p>
          DIN is not an open data-sharing network. The direction is aggregated, governed intelligence with businesses
          retaining control of permissions, approvals, private context, and professional responsibility.
        </p>
        <p>
          Technical and policy detail lives in our{" "}
          <Link href="/security" className="text-accent hover:underline">
            Security
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy
          </Link>{" "}
          pages. For access, use{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Contact
          </Link>
          .
        </p>
      </div>
      <div className="glass-card p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Network Partner Program</h2>
        <p>
          DONNA is developing an account-based program for qualified associations, brokerages, franchises,
          enterprises, and membership organizations that can create concentrated adoption and meaningful DIN density.
          Preferred terms would be tied to verified customer-account commitments, coordinated onboarding, and an
          organizational agreement rather than individual seat volume.
        </p>
        <p className="text-sm text-foreground/60">
          Exact partner rates remain under development and are not a public pricing tier. To discuss an organizational
          rollout, email{" "}
          <a href="mailto:derek@aidonna.co?subject=DONNA%20Network%20Partner%20Program" className="text-accent hover:underline">
            derek@aidonna.co
          </a>
          .
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
