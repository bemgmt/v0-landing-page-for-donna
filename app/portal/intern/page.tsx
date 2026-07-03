import { PageHeader } from "@/components/portal/dashboard/page-header"
import { ActionList, type ActionItem } from "@/components/portal/dashboard/action-list"
import { InternChecklist } from "@/components/portal/intern-checklist"
import { getPortalSession } from "@/lib/portal/session"
import { redirect } from "next/navigation"

export default async function InternDashboardPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { profile } = session
  if (profile.role !== "intern" && profile.role !== "admin" && profile.role !== "staff") {
    redirect("/portal")
  }

  const playbookLinks: ActionItem[] = [
    { title: "Main site", description: "Positioning, pricing logic, ecosystem framing", href: "https://aidonna.co", external: true },
    { title: "What is DONNA", description: "Deepest plain-language explainer", href: "https://aidonna.co/what-is-donna", external: true },
    { title: "Early Adopter Program", description: "Current GTM motion and offer", href: "https://aidonna.co/early-adopter-program", external: true },
    { title: "Intelligence Network", description: "The scaling / network-effect story", href: "https://aidonna.co/donna-intelligence-network", external: true },
    { title: "Tool Stack Audit", description: "Competitive / cost framing vs. incumbents", href: "https://aidonna.co/tool-audit", external: true },
    { title: "Class Materials", description: "Curated learning material", href: "https://aidonna.co/learn", external: true },
    { title: "NotebookLM", description: "Q&A + audio overviews on DONNA", href: "https://notebooklm.google.com/notebook/ef6a20e1-9bc3-402a-91f0-11f286c2c943", external: true },
    { title: "Investor demo", description: "See the investor-facing experience", href: "https://aidonna.co/demo", external: true },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Intern Portal"
        title="Intern Dashboard"
        subtitle="Welcome to your centralized hub. Check off your onboarding tasks and review the context pack materials below."
      />

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <InternChecklist />
        <ActionList title="Playbook Resources" items={playbookLinks} />
      </div>
    </div>
  )
}
