import type { Metadata } from "next"
import Link from "next/link"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = generatePageMetadata({
  title: "DONNA Capabilities & Documentation",
  description: "Technical overview and operational capabilities of the DONNA platform.",
  path: "/docs",
})

export default function DocsPage() {
  return (
    <MarketingSubpageShell
      title="Capabilities & Documentation"
      lead="A public overview of DONNA's operational capabilities, workflow execution, and intelligence network."
    >
      <div className="space-y-10 text-foreground/80">
        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <h2 className="text-xl font-medium text-foreground">1. Core Operational Intelligence</h2>
          <p>
            DONNA is not a standard LLM chatbot. It is an execution layer designed for high-communication SMBs.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li><strong>Omnichannel Routing:</strong> Ingests communication from SMS, Web Chat, Email, and Voice.</li>
            <li><strong>Contextual Awareness:</strong> Retains memory of past interactions, open deals, and active vendor timelines.</li>
            <li><strong>Workflow Execution:</strong> Translates incoming messages into structured database actions (CRM updates, task creation, dispatch triggers).</li>
          </ul>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <h2 className="text-xl font-medium text-foreground">2. Communication Handoff (Hybrid Mode)</h2>
          <p>
            While DONNA automates routine communication, it gracefully hands off complex or high-stakes interactions to human operators.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li><strong>Live Chat Takeover:</strong> Staff can monitor active sessions and instantly take over the conversation through the Partner Command Center.</li>
            <li><strong>Human-in-the-Loop Approval:</strong> Critical outbound messages (e.g., pricing quotes, compliance disclosures) can be queued for staff review before transmission.</li>
          </ul>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <h2 className="text-xl font-medium text-foreground">3. The Intelligence Network</h2>
          <p>
            A privacy-preserving federated learning layer that improves operational models without compromising business data.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Anonymized workflow successes and bottlenecks are analyzed across the network.</li>
            <li>Updates operational playbooks dynamically for all participating members.</li>
            <li>Opt-in required for early adopters.</li>
          </ul>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-xl space-y-4">
          <h2 className="text-xl font-medium text-foreground">4. System Requirements & Pricing</h2>
          <p>
            DONNA is delivered as an infrastructure layer, billed monthly based on usage and module activation.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Requires integration with existing systems (CRM, scheduling software) to function as the primary execution layer.</li>
            <li>See <Link href="/#pricing" className="text-accent hover:underline">Pricing</Link> for detailed tier breakdowns.</li>
          </ul>
        </section>
      </div>
    </MarketingSubpageShell>
  )
}
