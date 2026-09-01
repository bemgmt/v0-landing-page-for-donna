import type { Metadata } from "next"
import Link from "next/link"
import FAQ from "@/components/faq"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { marketingFaqs } from "@/lib/faq-content"
import { generatePageMetadata } from "@/lib/metadata"
import { breadcrumbListSchema, faqSchema, webPageSchema } from "@/lib/schema-markup"

const PAGE_DESCRIPTION =
  "Frequently asked questions about setting up DONNA, daily use, real-estate workflows, the Intelligence Network, privacy, plans, and access."
const LAST_REVIEWED = "2026-08-31"

export const metadata: Metadata = generatePageMetadata({
  title: "Real Estate AI FAQ",
  description: PAGE_DESCRIPTION,
  path: "/faq",
})

const schemaMarkup = {
  "@context": "https://schema.org",
  "@graph": [
    webPageSchema({
      name: "DONNA FAQ for Real Estate Professionals",
      description: PAGE_DESCRIPTION,
      path: "/faq",
      dateModified: LAST_REVIEWED,
    }),
    faqSchema(marketingFaqs),
    breadcrumbListSchema([
      { name: "Home", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
  ],
}

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <MarketingSubpageShell
        title="DONNA FAQ for real estate professionals"
        lead="Practical answers about setting up DONNA, working with it every day, coordinating transactions, protecting client information, and joining the DONNA Intelligence Network."
      >
        <div className="glass-card rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">New to DONNA?</p>
            <h2 className="mt-2 text-2xl font-semibold">Start with the six-step setup guide</h2>
            <p className="mt-2 text-foreground/65">
              Learn what to connect, what to teach DONNA, and how to set safe permission boundaries.
            </p>
          </div>
          <Link
            href="/getting-started"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-5 py-3 font-semibold text-background transition-colors hover:bg-accent/90"
          >
            Get set up
          </Link>
        </div>
        <FAQ hideHeading showAll />
        <p className="text-center text-sm text-foreground/50">
          Reviewed by the DONNA product team · Last reviewed <time dateTime={LAST_REVIEWED}>August 31, 2026</time>
        </p>
      </MarketingSubpageShell>
    </>
  )
}
