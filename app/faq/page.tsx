import type { Metadata } from "next"
import FAQ from "@/components/faq"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about DONNA — AI operational infrastructure for SMBs, the Intelligence Network, security, and early access.",
  path: "/faq",
})

export default function FaqPage() {
  return (
    <MarketingSubpageShell
      title="FAQ"
      lead="Direct answers about what DONNA is, who it is for, and how it differs from chatbots and fragmented tools."
    >
      <FAQ hideHeading />
    </MarketingSubpageShell>
  )
}
