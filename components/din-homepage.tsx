import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  FileCheck2,
  Handshake,
  Landmark,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
} from "lucide-react"

const transactionParticipants = [
  { label: "Agent", detail: "Relationship and representation", Icon: Users2 },
  { label: "Lender", detail: "Financing milestones", Icon: Landmark },
  { label: "Escrow + title", detail: "Documents and dependencies", Icon: FileCheck2 },
  { label: "Inspection", detail: "Scheduling and findings", Icon: Search },
  { label: "Insurance + vendors", detail: "Services and follow-through", Icon: Building2 },
]

const networkPrinciples = [
  {
    title: "Coordinate",
    body: "Create clearer requests, handoffs, milestones, and next steps across participating businesses.",
    status: "Network roadmap",
    Icon: Workflow,
  },
  {
    title: "Discover",
    body: "Help real-estate businesses identify relevant participating providers when work needs to move.",
    status: "Long-term vision",
    Icon: Search,
  },
  {
    title: "Learn",
    body: "Develop governed, privacy-preserving patterns about delays, bottlenecks, and better operating practices.",
    status: "Long-term vision",
    Icon: Sparkles,
  },
  {
    title: "Govern",
    body: "Keep permissions, confirmations, professional judgment, and accountability with the people responsible.",
    status: "Product principle",
    Icon: ShieldCheck,
  },
]

const currentCapabilities = [
  {
    title: "Communication",
    body: "Search, summarize, draft, and send through connected email, SMS, voice, and Slack workflows when authorized.",
  },
  {
    title: "Calendar + meetings",
    body: "Review availability, prepare context, schedule or update meetings, and preserve concrete commitments.",
  },
  {
    title: "Contacts + pipeline",
    body: "Create and update contacts, leads, statuses, notes, preferences, and interaction timelines.",
  },
  {
    title: "Knowledge + files",
    body: "Ground work in indexed documents, SOPs, websites, contracts, brand guidance, and connected storage.",
  },
  {
    title: "Operational support",
    body: "Surface missing follow-through, prepare next actions, and connect business context to governed execution.",
  },
  {
    title: "Controlled autonomy",
    body: "Use confirmation gates, recipient resolution, DNC safeguards, permissions, and activity records for consequential actions.",
  },
]

export default function DinHomepage() {
  return (
    <>
      <section id="network-problem" className="relative scroll-mt-20 border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">The operating problem</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl wow-glow">
              Real estate is already a network. Its systems aren&apos;t.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-foreground/75 sm:text-lg">
            <p>
              A transaction moves through separate businesses, inboxes, calendars, phone calls, documents, and databases.
              Everyone is working toward the same outcome, but people still have to hold the process together manually.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Status chasing", "Repeated requests", "Missed handoffs", "Disconnected context"].map((item) => (
                <div key={item} className="flex items-center gap-3 border-l border-accent/40 py-2 pl-4 text-foreground/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                  {item}
                </div>
              ))}
            </div>
            <p className="font-medium text-foreground">
              People should manage the relationship. The network should manage the coordination.
            </p>
          </div>
        </div>
      </section>

      <section id="network" className="relative scroll-mt-20 border-t border-white/5 bg-white/[0.015] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">One system, two levels of intelligence</p>
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl wow-glow">DONNA runs the business. DIN connects the industry.</h2>
          </div>
          <div className="grid overflow-hidden rounded-3xl border border-white/10 lg:grid-cols-2">
            <div className="relative bg-white/[0.03] p-8 sm:p-10">
              <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Available today · varies by configuration</p>
              <h3 className="mb-4 text-3xl font-semibold">DONNA</h3>
              <p className="text-lg leading-relaxed text-foreground/75">
                Operational intelligence inside a business, connecting communication, calendars, contacts, knowledge, and governed action through one shared context.
              </p>
            </div>
            <div className="relative bg-gradient-to-br from-accent/[0.08] via-primary/[0.08] to-transparent p-8 sm:p-10">
              <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-primary">The network being built</p>
              <h3 className="mb-4 text-3xl font-semibold">DIN</h3>
              <p className="text-lg leading-relaxed text-foreground/75">
                The DONNA Intelligence Network is the long-term operating network for permissioned coordination, discovery, and privacy-preserving intelligence between participating businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="connected-transaction" className="relative scroll-mt-20 border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">The connected transaction</p>
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl wow-glow">One transaction. One operating network.</h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/70">
              This is the DIN direction: each business keeps its own systems, permissions, data, and professional authority while the network helps make appropriate handoffs visible and actionable.
            </p>
          </div>
          <div className="relative grid gap-4 lg:grid-cols-5">
            <div className="absolute left-[8%] right-[8%] top-8 hidden h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent lg:block" aria-hidden />
            {transactionParticipants.map(({ label, detail, Icon }, index) => (
              <div key={label} className="relative rounded-2xl border border-white/10 bg-black/40 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                    <Icon className="h-6 w-6 text-accent" aria-hidden />
                  </div>
                  <span className="text-xs tabular-nums text-foreground/35">0{index + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 text-sm leading-relaxed text-foreground/70">
            <Network className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            Connected transaction workflows are roadmap and vision capabilities unless separately confirmed for a specific deployment.
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5 bg-white/[0.015] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-3">
              <Image
                src="/DINscreenshot.png"
                alt="DONNA Intelligence Network product concept interface"
                width={1200}
                height={800}
                className="h-auto w-full rounded-2xl"
              />
              <p className="px-3 pb-2 pt-4 text-xs leading-relaxed text-foreground/45">Product concept shown for the network direction; availability varies by deployment.</p>
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">How the network creates value</p>
              <div className="grid gap-6 sm:grid-cols-2">
                {networkPrinciples.map(({ title, body, status, Icon }) => (
                  <div key={title} className="border-l border-white/15 pl-5">
                    <Icon className="mb-4 h-6 w-6 text-accent" aria-hidden />
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">{body}</p>
                    <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary">{status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="relative scroll-mt-20 border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">The product today</p>
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl wow-glow">Context becomes action, with controls.</h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/70">
              Live capabilities are available in the product today. What each customer can use depends on connected integrations, permissions, data, and workspace configuration.
            </p>
          </div>
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {currentCapabilities.map(({ title, body }) => (
              <div key={title} className="border-t border-white/15 pt-5">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80">
              Review the capability framework <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section id="associations" className="relative scroll-mt-20 border-t border-white/5 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.05] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">Qualified Network Partner Program</p>
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl wow-glow">Your members are already a network. Give them infrastructure to operate like one.</h2>
            <a
              href="mailto:derek@aidonna.co?subject=DONNA%20Network%20Partner%20Program"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-accent/35 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              Discuss an organization rollout <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-foreground/70">
            <p>
              Associations already connect agents, lenders, escrow, title, inspectors, insurance, and service providers through trust, education, and referrals.
            </p>
            <p>
              DONNA&apos;s planned Network Partner Program would reward qualified associations, brokerages, franchises, enterprises, and membership organizations for creating concentrated adoption and DIN density.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-t border-white/15 pt-4">
                <p className="text-sm font-semibold text-foreground">Account-based qualification</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">Participation is measured by active customer accounts or workspaces, not the seats included inside an account.</p>
              </div>
              <div className="border-t border-white/15 pt-4">
                <p className="text-sm font-semibold text-foreground">Commitment earns economics</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">Preferred terms would be tied to annual agreements, minimum commitments, coordinated onboarding, and verified adoption.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/50">Exact partner rates remain under development and are not a public pricing tier. Current early-adopter pricing remains unchanged.</p>
            <div className="flex items-center gap-3 pt-1 font-medium text-foreground">
              <Handshake className="h-5 w-5 text-accent" aria-hidden /> Real estate first. A broader SMB platform over time.
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="relative scroll-mt-20 border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-foreground/55">Trust is infrastructure</p>
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl wow-glow">Autonomy should expand only where it is authorized and proven.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Human accountability", "People retain authority over judgment, fiduciary responsibilities, and consequential decisions."],
              ["Permissioned execution", "External actions follow workspace permissions, confirmation policies, and recipient resolution."],
              ["Safer context handling", "Controls are designed to reduce prompt-injection risk from retrieved emails, documents, and websites."],
              ["Operational records", "Action and activity records support oversight; available audit views depend on the deployment."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <ShieldCheck className="mb-5 h-6 w-6 text-accent" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">{body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-foreground/50">
            DONNA does not claim certifications, universal integration coverage, or unrestricted autonomy unless separately documented for the applicable deployment.
          </p>
        </div>
      </section>

      <section className="relative border-t border-white/5 bg-white/[0.015] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-accent/20 bg-gradient-to-r from-accent/[0.08] via-primary/[0.08] to-transparent p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <CalendarCheck2 className="h-4 w-4" aria-hidden /> First 100 customer accounts
            </div>
            <h2 className="text-3xl font-semibold">Join the first 100 customer accounts.</h2>
            <p className="mt-3 text-foreground/65">Early-adopter pricing includes Core DONNA at $500 per month for three seats or Full Access DONNA at $1,000 per month for six seats.</p>
          </div>
          <Link href="/#pricing" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background hover:bg-accent/90">
            View early access <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  )
}
