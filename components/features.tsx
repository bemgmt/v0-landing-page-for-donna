"use client"

import { useInView } from "react-intersection-observer"

interface FeatureCard {
  id: string
  icon: string
  title: string
  subtitle: string
  description: string
}

const coreCapabilities: FeatureCard[] = [
  {
    id: "agentic",
    icon: "🧠",
    title: "Agentic, Not Scripted",
    subtitle: "AI that reasons, plans, and executes",
    description:
      "DONNA thinks and acts independently. It reasons through problems, creates plans, executes tasks, and learns from outcomes, not just following scripts.",
  },
  {
    id: "human-loop",
    icon: "🤝",
    title: "Human-in-the-Loop by Design",
    subtitle: "Automation that knows when to escalate",
    description:
      "DONNA handles routine tasks automatically but always knows when to hand off to humans. Review, approve, or step in with one click, you stay in control.",
  },
  {
    id: "role-fluid",
    icon: "🔄",
    title: "Role-Fluid AI Floater",
    subtitle: "One AI, multiple roles",
    description:
      "DONNA dynamically shifts between roles, sales, marketing, operations, secretary, without retraining. One digital employee that adapts to your needs.",
  },
  {
    id: "tool-native",
    icon: "⚙️",
    title: "Tool-Native Control",
    subtitle: "Controls tools, not just suggests",
    description:
      "DONNA doesn't just recommend actions, it controls your tools. Sends emails, creates documents, launches campaigns, and triggers workflows directly.",
  },
  {
    id: "network-aware",
    icon: "🌐",
    title: "Network-Aware",
    subtitle: "Connects with other DONNAs",
    description:
      "DONNA understands and communicates with other DONNAs across teams, locations, or businesses. Secure, permissioned AI-to-AI coordination.",
  },
  {
    id: "multi-modal",
    icon: "💬",
    title: "Multi-Modal Communication",
    subtitle: "Voice, email, SMS, chat, and more",
    description:
      "Seamless communication across all channels. Real-time voice with transcription, intelligent email handling, SMS, web chat, and live dashboards, all in one system.",
  },
]

const functionalDomains: FeatureCard[] = [
  {
    id: "secretary",
    icon: "📋",
    title: "Secretary & Office Operations",
    subtitle: "Your digital front and back office",
    description:
      "Inbox triage, calendar scheduling, meeting participation with transcription and summaries, follow-up automation, and task creation. DONNA handles the admin work.",
  },
  {
    id: "sales",
    icon: "💰",
    title: "Sales & Lead Management",
    subtitle: "From first contact to close",
    description:
      "Website lead qualification, email and SMS responses, objection handling, appointment booking, lead scoring, and conversation sentiment analysis. Outbound campaigns optional.",
  },
  {
    id: "marketing",
    icon: "📈",
    title: "Marketing & Growth Operations",
    subtitle: "Campaigns, content, and SEO",
    description:
      "AI-generated campaigns, landing pages, and copy. A/B testing, keyword generation, local SEO, funnel tracking, and conversion attribution, all automated.",
  },
  {
    id: "automation",
    icon: "⚡",
    title: "Automation & Workflow Engine",
    subtitle: "Intelligent workflow automation",
    description:
      "Trigger workflows by message intent, time, or events. Conditional logic, retry handling, human approval gates. Connect to 600+ platforms and tools.",
  },
  {
    id: "memory",
    icon: "🧠",
    title: "Data, Memory & Intelligence",
    subtitle: "Learns and remembers",
    description:
      "Conversation memory per contact, organizational memory, task outcomes, and learned preferences. DONNA gets smarter with every interaction.",
  },
  {
    id: "integrations",
    icon: "🔗",
    title: "Enterprise Integrations",
    subtitle: "Works with your existing tools",
    description:
      "Instant integration with Google Workspace, Microsoft 365, CRMs, QuickBooks, Slack, Zendesk, and 600+ more platforms. Real-time or scheduled data sync.",
  },
]

export default function Features() {
  const { ref, inView } = useInView({ threshold: 0.1, once: true })

  return (
    <section id="products" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Core capabilities and functional domains designed for modern operations
          </p>
        </div>

        {/* Core Capabilities Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Core <span className="gradient-text">Capabilities</span>
            </h3>
            <p className="text-foreground/60 max-w-2xl mx-auto">
              The operating principles and technical foundation that make DONNA unique
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreCapabilities.map((feature, index) => (
              <div
                key={feature.id}
                className="group glass-card p-6 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="mb-4">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-accent font-medium">{feature.subtitle}</p>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </p>
                <div className="mt-4 h-0.5 bg-gradient-to-r from-accent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Functional Domains Section */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Functional <span className="gradient-text">Domains</span>
            </h3>
            <p className="text-foreground/60 max-w-2xl mx-auto">
              Business functions DONNA handles across your organization
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {functionalDomains.map((feature, index) => (
              <div
                key={feature.id}
                className="group glass-card p-6 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="mb-4">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-accent font-medium">{feature.subtitle}</p>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </p>
                <div className="mt-4 h-0.5 bg-gradient-to-r from-accent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
