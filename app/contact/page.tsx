import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "Contact",
  description:
    "Request access to DONNA — discovery calls, early adopter program, and general inquiries via the site form or email.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <MarketingSubpageShell
      title="Contact & request access"
      lead="Tell us about your operation. We’ll follow up with next steps — no spam, no pressure."
    >
      <div className="glass-card p-6 rounded-xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Discovery call</h2>
          <p className="text-foreground/80 mb-3">
            The fastest path is the early adopter interest form on the homepage — it feeds directly to our team.
          </p>
          <Link
            href="/#demo-form"
            className="inline-flex px-5 py-2.5 rounded-lg bg-accent text-background font-semibold hover:bg-accent/90 transition-colors"
          >
            Open the form on the homepage
          </Link>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Email</h2>
          <p className="text-foreground/80">
            <a href="mailto:info@bemdonna.com" className="text-accent hover:underline">
              info@bemdonna.com
            </a>
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Learn first</h2>
          <ul className="list-disc list-inside space-y-1 text-foreground/80">
            <li>
              <Link href="/what-is-donna" className="text-accent hover:underline">
                What is DONNA
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-accent hover:underline">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/early-adopter-program" className="text-accent hover:underline">
                Early Adopter Program
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </MarketingSubpageShell>
  )
}
