import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/breadcrumb'
import { generatePageMetadata } from '@/lib/metadata'
import { breadcrumbListSchema } from '@/lib/schema-markup'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Zap, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  Building2,
  BarChart3,
  Globe,
  Shield,
  Rocket
} from 'lucide-react'

export const metadata: Metadata = generatePageMetadata({
  title: "Investor relations",
  description:
    "Investment overview for DONNA — AI operational infrastructure for SMBs with unified communications, coordination, and execution, built on AWS-native foundations.",
  path: "/investors",
})

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />

        {/* Title Section */}
        <section className="py-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">DONNA</span> Investment Opportunity
          </h1>
          <p className="text-xl text-foreground/70 max-w-4xl mx-auto leading-relaxed">
            DONNA is AI operational infrastructure for SMBs — not a single-purpose chatbot, but a layer that
            unifies communication, coordination, and execution. Built on AWS-native foundations with voice,
            email, SMS, and workflow automation in one system.
          </p>
        </section>

        {/* Problem Section */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Target className="h-8 w-8 text-accent" />
              The Problem
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                Businesses are overwhelmed by routine admin. Workers spend an average of <strong>3.6 hours a day on email alone</strong>. 
                Response times are slow, causing lost revenue. Tools are fragmented. CRM, email, phone, SMS, and chat all operate 
                in separate silos. Admin labor costs continue rising.
              </p>
              <p className="text-foreground/80">
                No existing AI solution combines voice, email, SMS, meeting participation, and task execution in one affordable system.
              </p>
            </div>
          </div>
        </section>

        {/* Opportunity Section */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-accent" />
              The Opportunity
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                AI assistants are the <strong>fastest-growing sector in SaaS</strong>. Small and mid-sized businesses lack access 
                to powerful AI that is affordable and easy to deploy.
              </p>
              <p className="text-foreground/80">
                DONNA fills the market gap as hybrid horizontal plus vertical operational intelligence — designed
                for real estate, hospitality, health and beauty, contractors, and associations.
              </p>
            </div>
          </div>
        </section>

        {/* What is DONNA Section */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Zap className="h-8 w-8 text-accent" />
              What is DONNA?
            </h2>
            <p className="text-lg text-foreground/80 mb-6">
              DONNA runs operational workflows across communications, customer service, scheduling, lead
              qualification, data lookup, task execution, and in-meeting presence. Unlike simple chatbots, DONNA is
              built to coordinate work across email, phone, SMS, voice, chat, and internal operations at once.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <Calendar className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-bold mb-2">Secretary Bot</h3>
                <p className="text-sm text-foreground/70">
                  Attends meetings, transcribes, summarizes, and executes tasks. Provides follow-up emails, 
                  schedules appointments, and retrieves needed information.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <Mail className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-bold mb-2">Email Bot</h3>
                <p className="text-sm text-foreground/70">
                  Reads full email threads, understands context, writes intelligent replies, and maintains 
                  long-running conversations.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <Phone className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-bold mb-2">Voice Agent</h3>
                <p className="text-sm text-foreground/70">
                  Answers inbound calls, books appointments, collects information, and handles customer support. 
                  Built with ElevenLabs voice, Whisper transcription, and Verizon VOIP.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <MessageSquare className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-bold mb-2">Chatbot</h3>
                <p className="text-sm text-foreground/70">
                  Integrates into any website. White-labeled, reads policies, SOPs, and FAQs, and converts 
                  traffic into leads with intelligent reasoning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Market Validation */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Shield className="h-8 w-8 text-accent" />
              Market Validation
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                DONNA is being built <strong>AWS Native</strong>, leveraging AWS Connect, Bedrock, QuickSuite, and Semantics. 
                Verizon VOIP pathways provide telecom-grade reliability.
              </p>
              <p className="text-foreground/80">
                Early demand is strong across chambers, associations, and small business networks. Waitlist numbers continue 
                growing with high demo conversion rates.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-accent" />
              Pricing Model
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-4">Retail</h3>
                <ul className="space-y-2 text-foreground/80">
                  <li>• $1,500/mo</li>
                  <li>• $5,000/mo</li>
                  <li>• $12k+/mo</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-4">Wholesale</h3>
                <ul className="space-y-2 text-foreground/80">
                  <li>• $12k/mo plus $25k–$50k setup</li>
                  <li>• Optional revenue share</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-4">Early Adopter</h3>
                <p className="text-foreground/80">$5,000</p>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-4">Early Waitlist</h3>
                <p className="text-foreground/80">$1,000</p>
              </div>
            </div>
          </div>
        </section>

        {/* Profit Margin */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-accent" />
              Profit Margin
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                Running DONNA for <strong>100,000 users on AWS costs under $20k per month</strong>. With a target ARPU of 
                roughly $5,000/mo at scale, DONNA maintains an <strong className="text-accent">87% profit margin</strong>. 
                exceptionally high for SaaS.
              </p>
            </div>
          </div>
        </section>

        {/* Revenue Projections */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Rocket className="h-8 w-8 text-accent" />
              Revenue & User Projections
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                DONNA's <strong>150,000-user goal by December 2026</strong> is supported through:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/80">
                <li>Retail SaaS subscriptions</li>
                <li>White-label licensing</li>
                <li>Powerhouse vertical partnerships</li>
                <li>Strategic expo keynotes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Marketing Strategy */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Globe className="h-8 w-8 text-accent" />
              Marketing Strategy
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                The marketing plan leverages Derek's roles in WSGVR and the Monterey Park Chamber. DONNA will appear in:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/80 mb-4">
                <li>4 Small Business Expos</li>
                <li>4 major AI events</li>
                <li>2 major installations (CAR/NAR)</li>
              </ul>
              <p className="text-foreground/80">
                Ace PR drives national awareness. Two signature events hosted directly by Derek introduce DONNA to 
                hundreds of businesses.
              </p>
            </div>
          </div>
        </section>

        {/* Competitive Landscape */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-accent" />
              Competitive Landscape
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                Kore.AI, Cognigy, Gong, and Drift dominate the enterprise segment but are <strong>too expensive and complex 
                for SMBs</strong>. They lack DONNA's multi-channel integration, in-meeting participation, or white-label 
                vertical approach.
              </p>
              <p className="text-foreground/80">
                Smaller AI competitors offer limited features without voice, email integration, or workflow execution. 
                <strong> DONNA provides more tools at a fraction of the cost.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Business Model */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6">Business Model</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                DONNA monetizes through:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/80">
                <li>Monthly SaaS subscriptions</li>
                <li>White-label licensing</li>
                <li>Wholesale distribution</li>
                <li>Enterprise customization</li>
                <li>Add-on functionality</li>
              </ul>
              <p className="text-foreground/80 mt-4">
                Scalability is built into the model.
              </p>
            </div>
          </div>
        </section>

        {/* SAFE Structure */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6">SAFE Structure</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-3">$50k Tier</h3>
                <ul className="space-y-2 text-foreground/80">
                  <li>• 20% discount</li>
                  <li>• $8M valuation cap</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-3">$100k Tier</h3>
                <ul className="space-y-2 text-foreground/80">
                  <li>• 20% discount</li>
                  <li>• $7M valuation cap</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-3">$300k Tier</h3>
                <ul className="space-y-2 text-foreground/80">
                  <li>• 20% discount</li>
                  <li>• $5M valuation cap</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-6 rounded-lg bg-accent/10 border border-accent/30">
              <p className="text-foreground/80">
                <strong>Fund Allocation:</strong> AWS buildout, telecom integration, marketing, expos, PR, and sales expansion.
              </p>
            </div>
          </div>
        </section>

        {/* Payout Scenarios */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6">Payout Scenarios</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground/80 mb-4">
                Three valuation scenarios demonstrate investor upside:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-foreground/80">
                <li>Valuation meeting the cap</li>
                <li>Valuation at $15M</li>
                <li>Valuation at $50M+</li>
              </ol>
              <p className="text-foreground/80 mt-4">
                Each showing meaningful equity returns under the SAFE structure.
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6">Roadmap</h2>
            <div className="space-y-6">
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-3">2025</h3>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>Beta release</li>
                  <li>Voice agent expansion</li>
                  <li>AWS migration</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-3">2026</h3>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>White-label rollout</li>
                  <li>Vertical expansion</li>
                  <li>Expo keynotes</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-accent/20 bg-accent/5">
                <h3 className="text-xl font-bold mb-3">2027–2028</h3>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>Agent marketplace</li>
                  <li>Enterprise workforce automation</li>
                  <li>International scaling</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="py-12 max-w-6xl mx-auto">
          <div className="glass-card p-8 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-6">Join Us</h2>
            <p className="text-lg text-foreground/80 mb-8 max-w-3xl mx-auto">
              DONNA is high-margin, scalable operational intelligence infrastructure with a strong AWS foundation and
              telecom reach. With demand building across SMBs, DONNA is positioned to become the execution layer
              millions of businesses run on.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:investors@bemdonna.com"
                className="px-8 py-3 rounded-lg bg-accent text-background hover:bg-accent/90 transition-all font-semibold glow-accent hover:shadow-[0_0_30px_rgba(132,204,255,0.5)]"
              >
                Contact Investors Relations
              </a>
            </div>
            <p className="text-foreground/60 mt-6">
              investors@bemdonna.com
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
