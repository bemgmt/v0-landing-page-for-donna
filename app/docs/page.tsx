import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA Capabilities & Documentation",
  description: "A conservative overview of DONNA's live, configured, planned, and long-term product capabilities.",
  path: "/docs",
})

export default function DocsPage() {
  return (
    <MarketingSubpageShell
      title="Capabilities & Documentation"
      lead="Product truth starts by separating what is live, what requires configuration, what is planned, and what belongs to the long-term DIN vision."
    >
      <div className="space-y-10 text-foreground/80">
        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium text-foreground">1. Live product capabilities</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-accent">Available today</span>
          </div>
          <p>
            DONNA can connect business context to governed action across operational workflows.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Secretary support, summaries, drafting, meeting preparation, and follow-through assistance.</li>
            <li>Email, calendar, contact, lead, pipeline, SMS, voice, Slack, knowledge, and file workflows.</li>
            <li>Confirmation-aware external actions, recipient resolution, DNC safeguards, and activity records.</li>
          </ul>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium text-foreground">2. Configured capabilities</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-primary">Deployment-dependent</span>
          </div>
          <p>
            Availability depends on credentials, permissions, connected data, integration health, and organization-specific rules.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Google Workspace or Microsoft 365 connections.</li>
            <li>Slack, telephony, SMS, contact, lead, and business-knowledge access.</li>
            <li>Workspace permissions, confirmation policies, auto-send settings, templates, and escalation rules.</li>
          </ul>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium text-foreground">3. Planned product direction</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">No committed date</span>
          </div>
          <p>
            The roadmap is focused on deeper transaction orchestration and operational depth.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Broader real-estate transaction workflows, specialized vertical agents, and stronger handoffs.</li>
            <li>Expanded analytics, bottleneck detection, playbooks, admin controls, and background monitoring.</li>
            <li>Deeper CRM, transaction-management, document, and structured-data workflows.</li>
          </ul>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium text-foreground">4. Long-term DIN vision</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">Directional</span>
          </div>
          <p>
            DIN is the operating network DONNA is building for permissioned coordination, discovery, and privacy-preserving intelligence between businesses.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Businesses retain their own permissions, data, systems, and professional authority.</li>
            <li>Network capabilities should not be represented as universally available today.</li>
            <li>See <Link href="/donna-intelligence-network" className="text-accent hover:underline">DIN</Link> for the network direction and <Link href="/#pricing" className="text-accent hover:underline">Pricing</Link> for early access.</li>
          </ul>
        </section>

        <p className="text-sm text-foreground/50">
          Roadmap and vision statements are directional, not release commitments. Capabilities vary by workspace configuration, integrations, permissions, and available data.
        </p>
      </div>
    </MarketingSubpageShell>
  )
}
