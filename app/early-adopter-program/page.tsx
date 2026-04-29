import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Early Adopter Program",
  description:
    "Early adopters shape DONNA’s roadmap, get priority onboarding, and lock in early access pricing. Request a discovery call to learn more.",
  path: "/early-adopter-program",
})

export default function EarlyAdopterProgramPage() {
  return (
    <MarketingSubpageShell
      title="Early Adopter Program"
      lead="Help define operational intelligence for your industry while securing early access benefits."
    >
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-xl space-y-3">
          <h2 className="text-xl font-semibold">What you get</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>Direct input on product direction and integrations</li>
            <li>Priority onboarding and support</li>
            <li>Early access pricing and plan options (see on-site pricing)</li>
            <li>First access to new Intelligence Network capabilities as they roll out</li>
          </ul>
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
            — we&apos;ll schedule a short call with no pressure.
          </p>
        </div>
      </div>
    </MarketingSubpageShell>
  )
}
