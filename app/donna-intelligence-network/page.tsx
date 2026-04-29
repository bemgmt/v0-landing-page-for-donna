import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA Intelligence Network",
  description:
    "The DONNA Intelligence Network (DIN) lets operational patterns compound across the network while protecting private customer data.",
  path: "/donna-intelligence-network",
})

export default function DonnaIntelligenceNetworkPage() {
  return (
    <MarketingSubpageShell
      title="DONNA Intelligence Network (DIN)"
      lead="Network-level operational intelligence without pooling your proprietary customer data into a shared corpus."
    >
      <div className="glass-card p-6 rounded-xl space-y-4">
        <p>
          DIN is designed so aggregate, privacy-preserving signals improve how DONNA handles workflows — routing,
          follow-ups, and execution patterns — without exposing identifiable customer records between businesses.
        </p>
        <p>
          Your team keeps control of permissions and approvals; DONNA remains infrastructure you govern, not a black
          box that leaks context across tenants.
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
    </MarketingSubpageShell>
  )
}
