import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CalendarRange,
  CircleDollarSign,
  Handshake,
  Landmark,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { generatePageMetadata } from "@/lib/metadata"
import { breadcrumbListSchema } from "@/lib/schema-markup"

export const metadata: Metadata = generatePageMetadata({
  title: "Investor Overview",
  description:
    "DONNA is building the intelligence network for real estate, beginning with operational infrastructure inside each participating business.",
  path: "/investors",
})

const safeTiers = [
  { commitment: "$500,000", cap: "$18M", discount: "10%" },
  { commitment: "$1,000,000", cap: "$15M", discount: "15%" },
  { commitment: "$2,000,000", cap: "$12M", discount: "20%" },
]

const allocation = [
  { label: "Product + engineering", amount: "$800K", share: "40%" },
  { label: "Market entry + brand", amount: "$600K", share: "30%" },
  { label: "Sales + onboarding", amount: "$400K", share: "20%" },
  { label: "Operations + security + legal", amount: "$200K", share: "10%" },
]

const whyRealEstate = [
  {
    title: "Multi-business workflows",
    body: "Each transaction depends on organizations that operate through separate systems.",
    Icon: Building2,
  },
  {
    title: "Relationship-led distribution",
    body: "Associations and industry groups already connect the businesses DIN is designed to serve.",
    Icon: Handshake,
  },
  {
    title: "Visible operational pain",
    body: "Missed follow-through, handoff friction, and stalled work are concrete and observable.",
    Icon: Target,
  },
  {
    title: "Expansion path",
    body: "Real estate is the proving ground for a broader SMB operating platform over time.",
    Icon: Sparkles,
  },
]

const team = [
  {
    name: "Derek Talbird",
    role: "Founder and CEO",
    body: "Derek developed DONNA after more than 15 years across business development, technology, marketing, and operational systems, where he repeatedly saw capable employees burdened by fragmented tools and administrative work. Through Bird's Eye Management Services, founded in 2021, he began modernizing organizations' digital operations and expanded into practical AI consulting in 2022. He has taught AI through the West San Gabriel Valley Association of REALTORS and serves as Secretary and Education Chair for the Monterey Park Chamber of Commerce, where his programs have reached more than 200 people.",
  },
  {
    name: "Alexander Ray Williams",
    role: "Co-Founder of DONNA · Head of AI Innovation at Infinite Reality",
    body: "Alexander is a multidisciplinary AI engineer and product builder whose work spans AI agents, full-stack applications, voice interfaces, mobile products, spatial computing, and immersive digital experiences. At DONNA, he helps lead technical architecture, AI systems, product engineering, and DIN development.",
  },
  {
    name: "Domenica Romaniello, MSPM, PMP",
    role: "Chief of Staff",
    body: "Domenica is a certified Project Management Professional and Special Projects Manager at the USC Norris Comprehensive Cancer Center. At DONNA, she translates strategy into operating plans and coordinates team priorities.",
  },
  {
    name: "Lourdes Ahn",
    role: "Strategic Advisor",
    body: "Lourdes is a senior HR and organizational leadership executive specializing in strategic HR, change management, executive coaching, governance, and organizational transformation. She advises DONNA on workforce strategy, governance, and responsible scaling.",
  },
]

export default function InvestorsPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    ...breadcrumbListSchema([
      { name: "Home", path: "/" },
      { name: "Investors", path: "/investors" },
    ]),
  }

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />

        <header className="mx-auto max-w-5xl py-16 text-center md:py-24">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Investor overview · Pre-revenue</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl lg:text-7xl">
            Building the intelligence network for real estate.
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-foreground/70 md:text-xl">
            DONNA provides operational intelligence inside a business. The DONNA Intelligence Network is the long-term infrastructure for participating businesses to coordinate across the industry.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="mailto:derek@aidonna.co" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background hover:bg-accent/90">
              Request investor materials <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/donna-intelligence-network" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-medium text-foreground/80 hover:bg-white/5">
              Explore DIN
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-8 pb-20">
          <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.025] p-7 md:grid-cols-2 md:p-10">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">The problem</p>
              <h2 className="text-3xl font-semibold md:text-4xl">People are the connective tissue between disconnected systems.</h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-foreground/70">
              <p>Real-estate transactions move across agents, lenders, escrow, title, inspectors, insurance, vendors, documents, inboxes, calendars, and databases.</p>
              <p>The industry has software. It lacks shared operational infrastructure.</p>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-accent/20 bg-accent/[0.045] p-7 md:p-9">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Product today · Configuration-dependent</p>
              <Workflow className="mb-6 h-8 w-8 text-accent" aria-hidden />
              <h2 className="text-3xl font-semibold">DONNA runs the business.</h2>
              <p className="mt-4 leading-relaxed text-foreground/70">Communication, calendar, contacts, leads, knowledge, files, and governed actions share operational context inside a configured workspace.</p>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-primary/[0.045] p-7 md:p-9">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Roadmap + long-term vision</p>
              <Network className="mb-6 h-8 w-8 text-primary" aria-hidden />
              <h2 className="text-3xl font-semibold">DIN connects the industry.</h2>
              <p className="mt-4 leading-relaxed text-foreground/70">Permissioned coordination, provider discovery, and privacy-preserving network intelligence between participating businesses.</p>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-accent/20 bg-accent/[0.045] p-7 md:p-9">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Mission</p>
              <h2 className="text-3xl font-semibold">Transform how work gets done.</h2>
              <p className="mt-4 leading-relaxed text-foreground/70">Make businesses more efficient so people have the freedom to focus, thrive, and do their best work.</p>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-primary/[0.045] p-7 md:p-9">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Vision</p>
              <h2 className="text-3xl font-semibold">Change how businesses work together.</h2>
              <p className="mt-4 leading-relaxed text-foreground/70">Build permissioned intelligence networks that help businesses retain customers, lower advertising spend, and operate more efficiently without pooling private data or reducing headcount.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 p-7 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">Why real estate first</p>
                <h2 className="text-3xl font-semibold md:text-4xl">A dense, repeatable coordination environment.</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {whyRealEstate.map(({ title, body, Icon }) => (
                  <div key={title} className="border-t border-white/10 pt-5">
                    <Icon className="mb-4 h-5 w-5 text-accent" aria-hidden />
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/60">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7 md:p-9">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">Early-adopter business model</p>
              <h2 className="text-3xl font-semibold">Simple account pricing. Built-in team capacity.</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="border-t border-accent/35 pt-5">
                  <p className="text-sm font-medium text-accent">Core DONNA</p>
                  <p className="mt-2 text-3xl font-semibold">$500<span className="text-sm font-normal text-foreground/45"> / month</span></p>
                  <p className="mt-2 text-sm text-foreground/65">Three total seats</p>
                </div>
                <div className="border-t border-primary/35 pt-5">
                  <p className="text-sm font-medium text-primary">Full Access DONNA</p>
                  <p className="mt-2 text-3xl font-semibold">$1,000<span className="text-sm font-normal text-foreground/45"> / month</span></p>
                  <p className="mt-2 text-sm text-foreground/65">Six total seats</p>
                </div>
              </div>
              <p className="mt-7 text-sm leading-relaxed text-foreground/55">Available to the first 100 customer accounts. Both plans include a 30-day free trial, require a credit card, and are subject to platform usage limits.</p>
            </div>
            <div className="rounded-3xl border border-white/10 p-7 md:p-9">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">Go-to-market</p>
              <h2 className="text-3xl font-semibold">Build density through trusted networks.</h2>
              <ul className="mt-7 space-y-4 text-foreground/70">
                <li className="flex gap-3"><Handshake className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden /> Associations and concentrated industry communities</li>
                <li className="flex gap-3"><Landmark className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden /> Professional groups, memberships, and partnership access</li>
                <li className="flex gap-3"><CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden /> Booths, events, podcasts, education, and founder-led demonstrations</li>
              </ul>
              <p className="mt-7 text-sm text-foreground/50">The strategy prioritizes relationship-led market entry rather than cold outbound as the primary motion.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-transparent to-accent/[0.05] p-7 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Planned Network Partner Program</p>
                <h2 className="text-3xl font-semibold md:text-4xl">Exchange preferred economics for distribution and network density.</h2>
                <p className="mt-5 leading-relaxed text-foreground/70">
                  Qualified associations, brokerages, franchises, enterprises, and membership organizations could earn preferred account-based terms by committing to concentrated adoption, coordinated onboarding, and continued DIN participation.
                </p>
                <a href="mailto:derek@aidonna.co?subject=DONNA%20Network%20Partner%20Program" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80">
                  Discuss a qualified rollout <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Account-based", "Qualification is measured using active customer accounts or workspaces, not included seats."],
                  ["Contracted", "Annual terms and minimum monthly commitments are intended to protect recurring revenue."],
                  ["Verified", "Periodic account certification keeps preferred terms tied to actual adoption."],
                  ["Separate", "Organizational terms would not stack with individual referral or partner benefits unless expressly agreed."],
                ].map(([title, body]) => (
                  <div key={title} className="border-t border-white/15 pt-5">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/60">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-relaxed text-foreground/45">
              Exact partner rates remain under development. No Network Partner discount, referral reduction, or DIN monetization is included in the current market sizing or base financial projection.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 p-7 md:p-10">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">Current stage</p>
                <h2 className="text-3xl font-semibold md:text-4xl">Pre-revenue, with a 24-month commercialization plan.</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-foreground/55">No customer traction, conversion, revenue, retention, or network-effect claims are presented as achieved.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {["Verify product-market fit", "Onboard the first 100 accounts", "Produce customer evidence", "Pilot repeatable network entry"].map((item, index) => (
                <div key={item} className="border-t border-white/10 pt-5">
                  <p className="text-xs tabular-nums text-accent">0{index + 1}</p>
                  <p className="mt-3 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 p-7 md:p-10">
            <div className="mb-9 max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">Founding and management team</p>
              <h2 className="text-3xl font-semibold md:text-4xl">Built by operators, technologists, and organizational leaders.</h2>
              <p className="mt-4 leading-relaxed text-foreground/60">AI DONNA, Co. was incorporated in Delaware on May 26, 2026.</p>
            </div>
            <div className="grid gap-7 md:grid-cols-2">
              {team.map((member) => (
                <article key={member.name} className="border-t border-white/15 pt-5">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-accent">{member.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/65">{member.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] to-transparent p-7 md:p-9">
              <div className="flex items-center gap-3 text-accent"><CircleDollarSign className="h-6 w-6" aria-hidden /><p className="text-xs font-semibold uppercase tracking-[0.25em]">$2M aggregate SAFE cap</p></div>
              <h2 className="mt-6 text-3xl font-semibold">Larger commitments receive stronger economics.</h2>
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.15em] text-foreground/45"><span>Commitment</span><span>Valuation cap</span><span>Discount</span></div>
                {safeTiers.map((tier) => (
                  <div key={tier.commitment} className="grid grid-cols-3 border-t border-white/10 px-4 py-4 text-sm"><span className="font-medium">{tier.commitment}</span><span>{tier.cap}</span><span>{tier.discount}</span></div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-foreground/45">The round closes when aggregate commitments reach $2M. Terms are subject to counsel review and definitive SAFE agreements.</p>
            </div>

            <div className="rounded-3xl border border-white/10 p-7 md:p-9">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">Proposed 24-month allocation</p>
              <h2 className="text-3xl font-semibold">Fund product depth and relationship-led market entry.</h2>
              <div className="mt-8 space-y-5">
                {allocation.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span>{item.label}</span><span className="text-foreground/55">{item.amount} · {item.share}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ width: item.share }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-relaxed text-foreground/45">Illustrative allocation pending the final operating model, compensation plan, and hiring schedule.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-accent/[0.05] to-transparent p-8 text-center md:p-12">
            <ShieldCheck className="mx-auto h-8 w-8 text-accent" aria-hidden />
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold md:text-5xl">Real estate is the proving ground. DIN is the network.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-foreground/65">DONNA is raising up to $2M to deepen the product, acquire the first 100 customer accounts, and build a repeatable path into the industry through trusted networks.</p>
            <a href="mailto:derek@aidonna.co" className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background hover:bg-accent/90">Contact investor relations <ArrowRight className="h-4 w-4" aria-hidden /></a>
          </section>

          <p className="text-center text-xs leading-relaxed text-foreground/40">This page is for informational purposes only and does not constitute an offer to sell or a solicitation to purchase securities.</p>
        </main>
      </div>
    </div>
  )
}
