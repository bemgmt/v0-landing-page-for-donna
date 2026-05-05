import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA Industries",
  description: "Explore how DONNA powers operations across high-communication industries like real estate, mortgage, title, and home services.",
  path: "/industries",
})

export default function IndustriesIndexPage() {
  const industries = [
    { title: "Real Estate", href: "/industries/real-estate", desc: "Deal communication and coordination across agents, lenders, and title." },
    { title: "Mortgage", href: "/industries/mortgage", desc: "Pipeline coordination, document chase, and borrower communication." },
    { title: "Title & Escrow", href: "/industries/title", desc: "Clearing tasks, partner communication, and closing readiness." },
    { title: "Home Services", href: "/industries/home-services", desc: "Scheduling, dispatch coordination, and customer follow-through." }
  ]

  return (
    <MarketingSubpageShell
      title="Industries We Serve"
      lead="DONNA is built for high-stakes, high-communication workflows where dropped handoffs are expensive."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {industries.map((ind) => (
          <Link
            key={ind.href}
            href={ind.href}
            className="glass-card p-6 rounded-xl hover:border-cyan-400/30 transition-colors block"
          >
            <h2 className="text-xl font-medium text-foreground mb-2">{ind.title}</h2>
            <p className="text-sm text-muted-foreground">{ind.desc}</p>
            <p className="text-accent text-sm mt-4 font-medium">Learn more →</p>
          </Link>
        ))}
      </div>
    </MarketingSubpageShell>
  )
}
