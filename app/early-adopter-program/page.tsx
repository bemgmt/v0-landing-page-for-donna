import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Early Adopter Program",
  description:
    "The first 100 DONNA customer accounts receive early-adopter pricing with a 30-day free trial and platform-managed usage limits.",
  path: "/early-adopter-program",
})

export default function EarlyAdopterProgramPage() {
  return (
    <MarketingSubpageShell
      title="Early Adopter Program"
      lead="Early-adopter pricing is available to the first 100 DONNA customer accounts."
    >
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-xl space-y-3">
          <h2 className="text-xl font-semibold">Commercial terms</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>Core DONNA at $500/month with three total seats</li>
            <li>Full Access DONNA at $1,000/month with six total seats</li>
            <li>A 30-day free trial on either plan; credit card required</li>
            <li>Usage allowances managed within the platform</li>
          </ul>
          <p className="text-sm text-foreground/55">Plan usage limits apply. Included seats do not count separately toward the 100-account limit.</p>
        </div>
        <div className="glass-card p-6 rounded-xl space-y-3">
          <h2 className="text-xl font-semibold">Next step</h2>
          <p className="text-foreground/80">
            Use the discovery form on the{" "}
            <Link href="/#demo-form" className="text-accent hover:underline">
              homepage
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-accent hover:underline">
              contact us
            </Link>{" "}
            . We&apos;ll schedule a short call with no pressure.
          </p>
        </div>
        <div className="glass-card p-6 rounded-xl space-y-3">
          <h2 className="text-xl font-semibold">Association and organizational deployments</h2>
          <p className="text-foreground/80">
            Qualified associations, brokerages, franchises, enterprises, and membership organizations can discuss a
            planned Network Partner arrangement based on active customer-account commitments, coordinated onboarding,
            and a formal organizational agreement.
          </p>
          <p className="text-sm text-foreground/55">
            Network Partner rates are not yet a public tier and do not stack with individual referral or partner benefits.
            Contact{" "}
            <a href="mailto:derek@aidonna.co?subject=DONNA%20Network%20Partner%20Program" className="text-accent hover:underline">
              derek@aidonna.co
            </a>{" "}
            to discuss a qualified rollout.
          </p>
        </div>
      </div>
    </MarketingSubpageShell>
  )
}
