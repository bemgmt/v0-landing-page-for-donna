import Link from "next/link"
import { ActionList } from "@/components/portal/dashboard/action-list"
import { PageHeader } from "@/components/portal/dashboard/page-header"
import { requirePartnerPortal } from "@/lib/portal/require-partner"

const NOTEBOOKLM_URL =
  "https://notebooklm.google.com/notebook/ef6a20e1-9bc3-402a-91f0-11f286c2c943"

export default async function PartnerStartPage() {
  await requirePartnerPortal()

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Onboarding"
        title="Start here"
        subtitle="A short path from sign-in to your first confident conversation about DONNA."
      />

      <ActionList
        title="Recommended first steps"
        items={[
          {
            title: "Download the Strategic Partner Program",
            description: "Commission table, payouts, and the 30-day refund window for chargebacks.",
            href: "/api/portal/strategic-partner-docs/strategic-partner-program",
          },
          {
            title: "Read the ICP guide",
            description: "Who buys DONNA and how to qualify conversations.",
            href: "/api/portal/strategic-partner-docs/strategic-partner-icp",
          },
          {
            title: "Skim the onboarding packet",
            description: "Expectations and how we work with partners.",
            href: "/api/portal/strategic-partner-docs/strategic-partner-onboarding",
          },
          {
            title: "Review approved messaging",
            description: "Stay on-brand when you pitch.",
            href: "/api/portal/strategic-partner-docs/approved-messaging-guide",
          },
          {
            title: "Open NotebookLM (curated DONNA context)",
            description: "External — deep reference and audio overview.",
            href: NOTEBOOKLM_URL,
            external: true,
          },
          {
            title: "Try Can DONNA in the member portal",
            description: "Practice positioning with the assistant.",
            href: "/portal/can-donna",
          },
          {
            title: "See open leads (round robin)",
            description: "Know what is available before you claim.",
            href: "/partner/leads/round-robin",
          },
          {
            title: "Need a human?",
            description: "Support chat lives in the member portal.",
            href: "/portal/support",
          },
        ]}
      />

      <p className="text-sm text-muted-foreground">
        When you are ready, return to the{" "}
        <Link href="/partner" className="text-cyan-300 hover:underline">
          command center
        </Link>
        .
      </p>
    </div>
  )
}
