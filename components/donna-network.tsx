"use client"

import { useInView } from "react-intersection-observer"

const networkUseCases = [
  {
    title: "Business-to-Business Automation",
    description: "Schedule meetings, confirm contracts, and share status updates between companies without manual emails or phone calls.",
    icon: "🤝",
  },
  {
    title: "Marketing & Growth Coordination",
    description: "Cross-promote campaigns, verify referrals, and hand off leads between partner businesses automatically.",
    icon: "📈",
  },
  {
    title: "Operations & Vendor Management",
    description: "Coordinate supply chain updates, vendor communications, and compliance confirmations across your network.",
    icon: "⚙️",
  },
  {
    title: "Manufacturing & Logistics",
    description: "Coordinate production schedules, shipping updates, and inventory management between manufacturers, suppliers, and distributors.",
    icon: "🏭",
  },
]

const networkFeatures = [
  {
    title: "Secure & Permissioned",
    description: "Explicit opt-in required. You control who DONNA talks to and what information is shared.",
  },
  {
    title: "Scoped Permissions",
    description: "Set specific permissions for each connection. No raw data sharing—only structured requests and outcomes.",
  },
  {
    title: "Fully Auditable",
    description: "Every network exchange is logged and traceable. Complete transparency and compliance.",
  },
]

export default function DonnaNetwork() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  return (
    <section id="donna-network" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="max-w-6xl mx-auto">
        {/* Section header with slogan */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Works Alone. Works Together. <span className="gradient-text">Grows With You.</span>
          </h2>
          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto mb-6">
            DONNA works as a digital employee inside your business — answering calls, handling emails, booking appointments, and following up automatically.
          </p>
          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto mb-8">
            As your business grows, DONNA can also securely coordinate with other DONNAs across teams, locations, or businesses. This reduces manual handoffs, expands your network, eliminates duplicated work, and keeps everything moving without slowing your team down.
          </p>
        </div>

        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            The <span className="gradient-text">DONNA-to-DONNA Network</span>
          </h3>
          <p className="text-foreground/60 max-w-3xl mx-auto text-lg">
            A critical differentiator: DONNAs communicate, coordinate, and collaborate with each other—transforming individual AI assistants into a connected network of intelligence.
          </p>
        </div>

        {/* What is the Network */}
        <div className="glass-card p-8 rounded-xl mb-12 animate-slide-up">
          <h3 className="text-2xl font-bold mb-4 text-foreground">What is the Network?</h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            The DONNA-to-DONNA Network is a secure, permissioned AI-to-AI communication layer that allows DONNAs to discover one another, exchange structured requests, share outcomes, and coordinate actions across organizations.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            This transforms DONNA from a tool into a <strong className="text-foreground">marketplace of intelligence and execution</strong>—where work moves faster than humans can coordinate it.
          </p>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">
            Network <span className="gradient-text">Use Cases</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {networkUseCases.map((useCase, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h4 className="text-xl font-bold mb-3 text-foreground">{useCase.title}</h4>
                <p className="text-foreground/70 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Network Rules */}
        <div className="glass-card p-8 rounded-xl">
          <h3 className="text-2xl font-bold mb-6 text-foreground">
            Network <span className="gradient-text">Rules & Security</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {networkFeatures.map((feature, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 75}ms` }}>
                <h4 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h4>
                <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Future Vision */}
        <div className="mt-12 text-center animate-fade-in">
          <p className="text-foreground/60 italic max-w-2xl mx-auto mb-6">
            Coming soon: The DONNA Marketplace—where organizations can offer specialized services, subscribe to industry-specific DONNAs, and license vertical intelligence.
          </p>
          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto mb-6">
            You get more time back, faster responses, and the ability to scale without hiring.
          </p>
          <p className="text-sm text-foreground/50 italic">
            Advanced DONNA-to-DONNA coordination is available on higher plans.{" "}
            <a 
              href="#pricing" 
              className="text-accent hover:text-accent/80 transition-colors underline underline-offset-4"
            >
              See Plans
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

