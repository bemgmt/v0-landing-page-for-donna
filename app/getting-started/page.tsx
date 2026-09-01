import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Download, ShieldCheck } from "lucide-react"
import { MarketingSubpageShell } from "@/components/marketing-subpage-shell"
import { generatePageMetadata } from "@/lib/metadata"
import { breadcrumbListSchema, webPageSchema } from "@/lib/schema-markup"

const PAGE_DESCRIPTION =
  "A practical real-estate AI workflow setup guide for connecting tools, teaching DONNA how your business works, setting permissions, and testing your workspace."
const LAST_REVIEWED = "2026-08-31"

export const metadata: Metadata = generatePageMetadata({
  title: "Real Estate AI Workflow Setup Guide",
  description: PAGE_DESCRIPTION,
  path: "/getting-started",
})

const setupSteps = [
  {
    title: "Create your DONNA account",
    description:
      "Choose the account and team capacity that fit your business. Each person who needs their own access, context, permissions, and accountability should have a seat.",
  },
  {
    title: "Connect the tools you already use",
    description:
      "Connect the supported communication, calendar, contact, knowledge, and workflow tools that matter to your day-to-day work. A specific connection is confirmed during onboarding; availability depends on the platform, credentials, APIs, and deployment.",
  },
  {
    title: "Teach DONNA about your business",
    description:
      "Share your market, specialties, working hours, communication preferences, team responsibilities, and the way you prefer work to move from one person or stage to the next.",
  },
  {
    title: "Add your business knowledge",
    description:
      "Bring in the material your team relies on: templates, procedures, transaction checklists, FAQs, preferred vendors, service standards, and other approved reference information.",
  },
  {
    title: "Choose your permission boundaries",
    description:
      "Decide what DONNA may prepare, what it may complete as a routine low-risk action, what needs your approval, and what it should never do automatically. Start conservatively and expand only when you are comfortable.",
  },
  {
    title: "Test before you expand",
    description:
      "Run realistic examples, review the context DONNA uses, confirm recipients and outcomes, and adjust your rules. Add more workflows only after the current setup behaves the way you expect.",
  },
]

const workspaceAreas = [
  {
    title: "Brand context",
    description: "Trusted files and public pages can be collected, structured into a draft, and reviewed before use.",
  },
  {
    title: "Business identity",
    description: "Set the business name, primary contact, timezone, language, and approved brand voice.",
  },
  {
    title: "Tools and knowledge",
    description: "Configure available integrations, channels, skills, knowledge sources, and automations.",
  },
  {
    title: "Account controls",
    description: "Keep privacy, security, billing, and other administrative settings visible and separate.",
  },
]

const workflowExamples = [
  {
    title: "New lead follow-through",
    description:
      "A connected lead or inbox workflow can preserve the contact context, prepare an approved response, and surface the next follow-up instead of relying on memory.",
  },
  {
    title: "Transaction deadline awareness",
    description:
      "A configured transaction workflow can connect checklist and calendar context so approaching deadlines and missing items are easier to see and act on.",
  },
  {
    title: "Brand-consistent communication",
    description:
      "Approved source material, templates, and voice guidance can help drafts stay aligned with the business before a person reviews or sends them.",
  },
]

const operatingRhythm = [
  {
    label: "Day one",
    title: "Connect, teach, and set boundaries",
    description: "Give DONNA the approved tools, business context, knowledge, and permissions it needs to help.",
  },
  {
    label: "Every day",
    title: "Focus on what needs attention",
    description:
      "DONNA is designed to monitor authorized workflows, handle permitted routine work, and surface deadlines, responses, approvals, and exceptions.",
  },
  {
    label: "Every transaction",
    title: "Keep the moving pieces organized",
    description:
      "Use DONNA to help maintain context, follow-ups, outstanding items, and next steps even when the other people in the transaction do not use DONNA.",
  },
  {
    label: "As DIN grows",
    title: "Coordinate across participating businesses",
    description:
      "The DONNA Intelligence Network is intended to support permissioned referrals, handoffs, and coordination between businesses without unnecessarily exposing private customer information.",
  },
]

const schemaMarkup = {
  "@context": "https://schema.org",
  "@graph": [
    webPageSchema({
      name: "How to Set Up DONNA for Your Real Estate Business",
      description: PAGE_DESCRIPTION,
      path: "/getting-started",
      dateModified: LAST_REVIEWED,
    }),
    breadcrumbListSchema([
      { name: "Home", path: "/" },
      { name: "Getting Started", path: "/getting-started" },
    ]),
  ],
}

export default function GettingStartedPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <MarketingSubpageShell
        title="How to set up DONNA for your real estate business"
        lead="Teach DONNA how you work once, set clear boundaries, and give it the context to help keep your real-estate workflows moving."
      >
        <section aria-labelledby="setup-steps-heading">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Real estate AI setup</p>
            <h2 id="setup-steps-heading" className="mt-2 text-3xl font-semibold">
              Your six-step setup path
            </h2>
            <p className="mt-3 leading-relaxed text-foreground/65">
              Setup is about giving DONNA the right context and permissions—not rebuilding your business around
              another system. The exact capabilities available to you depend on your workspace configuration,
              integrations, permissions, and connected data.
            </p>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {setupSteps.map((step, index) => (
              <li key={step.title} className="glass-card rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-foreground/65">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="product-view-heading">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Inside the workspace</p>
            <h2 id="product-view-heading" className="mt-2 text-3xl font-semibold">
              See the setup experience
            </h2>
            <p className="mt-3 leading-relaxed text-foreground/65">
              These product screens show how source collection, human review, identity, integrations, knowledge,
              automation, privacy, and account controls stay visible during setup.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <figure className="glass-card overflow-hidden rounded-2xl p-3 sm:p-5">
              <Image
                src="/donna-brand-onboarding.png"
                alt="DONNA brand onboarding screen showing the five-step source collection, extraction, review, and completion workflow"
                width={1897}
                height={994}
                sizes="(max-width: 1024px) calc(100vw - 48px), 896px"
                className="h-auto w-full rounded-xl border border-white/10"
              />
              <figcaption className="px-2 pb-1 pt-4 text-sm leading-relaxed text-foreground/60">
                Guided brand onboarding starts with trusted materials, turns them into a structured draft, and keeps
                approval visible before the result becomes available to configured workflows.
              </figcaption>
            </figure>

            <figure className="glass-card overflow-hidden rounded-2xl p-3 sm:p-5">
              <Image
                src="/donna-settings-configuration.png"
                alt="DONNA settings screen showing business identity, brand voice, integrations, knowledge, automations, privacy, and billing navigation"
                width={1890}
                height={991}
                sizes="(max-width: 1024px) calc(100vw - 48px), 896px"
                className="h-auto w-full rounded-xl border border-white/10"
              />
              <figcaption className="px-2 pb-1 pt-4 text-sm leading-relaxed text-foreground/60">
                Workspace settings keep business identity and brand voice alongside the tools, knowledge, automations,
                privacy, and account controls that shape how DONNA operates.
              </figcaption>
            </figure>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {workspaceAreas.map((area) => (
              <article key={area.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-semibold">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/65">{area.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-foreground/50">
            Interface and feature availability can vary by workspace configuration, credentials, permissions, and deployment.
          </p>
        </section>

        <section aria-labelledby="workflow-examples-heading">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Practical examples</p>
            <h2 id="workflow-examples-heading" className="mt-2 text-3xl font-semibold">
              What a configured real-estate workflow can look like
            </h2>
            <p className="mt-3 leading-relaxed text-foreground/65">
              These examples illustrate the outcome of a well-scoped setup. The actions available in a specific
              workspace depend on its connected systems and approved permissions.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workflowExamples.map((example) => (
              <article key={example.title} className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold">{example.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">{example.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="glass-card rounded-2xl border border-accent/20 p-6 sm:p-8"
          aria-labelledby="permissions-heading"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ShieldCheck className="size-10 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 id="permissions-heading" className="text-2xl font-semibold">
                A simple way to set permissions
              </h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <div>
                  <h3 className="font-semibold">Review first</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/65">
                    DONNA prepares drafts, recommendations, or next steps for your approval.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Assist with routine work</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/65">
                    Permit defined, low-risk actions while keeping important decisions with you.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Trust proven workflows</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/65">
                    Allow tested, predefined workflows to run and bring exceptions or sensitive situations to you.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm font-medium text-foreground/80">
                The goal: manage the exceptions without having to manage DONNA all day.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="rhythm-heading">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">The working rhythm</p>
            <h2 id="rhythm-heading" className="mt-2 text-3xl font-semibold">
              What setup is meant to unlock
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {operatingRhythm.map((item) => (
              <article key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{item.label}</p>
                <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-foreground/65">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6 sm:p-8" aria-labelledby="checklist-heading">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Prepare before onboarding</p>
              <h2 id="checklist-heading" className="mt-2 text-2xl font-semibold">
                Download the real-estate onboarding checklist
              </h2>
              <p className="mt-2 leading-relaxed text-foreground/65">
                Gather your tools, team roles, business knowledge, permission decisions, and test scenarios before
                the setup call so the first configuration pass is concrete.
              </p>
            </div>
            <a
              href="/downloads/donna-real-estate-onboarding-checklist.md"
              download
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-accent/35 px-5 py-3 font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <Download className="size-4" aria-hidden="true" />
              Download checklist
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link href="/docs" className="text-accent hover:underline">
              Review current capabilities
            </Link>
            <Link href="/security" className="text-accent hover:underline">
              Read about security and oversight
            </Link>
            <Link href="/privacy" className="text-accent hover:underline">
              Review privacy practices
            </Link>
          </div>
        </section>

        <section
          className="rounded-2xl bg-gradient-to-br from-accent/15 to-primary/10 p-6 sm:p-8"
          aria-labelledby="ready-heading"
        >
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 size-7 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 id="ready-heading" className="text-2xl font-semibold">
                Ready to start?
              </h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-foreground/70">
                Start with a discovery call so we can confirm the tools and workflows that matter to your business,
                then build a setup plan around what is actually supported.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 font-semibold text-background transition-colors hover:bg-accent/90"
                >
                  Request access
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-5 py-3 font-semibold transition-colors hover:bg-white/5"
                >
                  Read the full FAQ
                </Link>
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-sm text-foreground/50">
          Reviewed by the DONNA product team · Last reviewed <time dateTime={LAST_REVIEWED}>August 31, 2026</time>
        </p>
      </MarketingSubpageShell>
    </>
  )
}
