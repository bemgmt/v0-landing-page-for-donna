"use client"

import { useInView } from "react-intersection-observer"

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })

  const handleScrollToForm = () => {
    const form = document.getElementById("demo-form")
    form?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="pricing" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              name: "Starter",
              price: "1,500",
              priceUnit: "/mo",
              description: "Perfect for small businesses getting started",
              cta: "Get Started",
              featured: false
            },
            {
              name: "Pro",
              price: "5,000",
              priceUnit: "/mo",
              description: "Ideal for growing businesses",
              cta: "Get Started",
              featured: true
            },
            {
              name: "Enterprise",
              price: "12,000",
              priceUnit: "/mo",
              description: "For large organizations with custom needs",
              cta: "Contact Us",
              featured: false
            },
          ].map((tier, index) => (
            <div
              key={index}
              className={`p-8 rounded-xl transition-all duration-300 animate-slide-up ${
                tier.featured
                  ? "glass-card border-2 border-accent glow-accent scale-105 md:scale-110"
                  : "glass-card border border-white/10"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tier.featured && <div className="text-xs font-bold text-accent mb-3 uppercase">Most Popular</div>}
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold gradient-text">${tier.price}</span>
                {tier.priceUnit && <span className="text-lg text-foreground/70">{tier.priceUnit}</span>}
              </div>
              <div className="text-sm text-foreground/70 mb-6">{tier.description}</div>
              <button
                onClick={handleScrollToForm}
                className={`w-full py-2 rounded-lg font-medium transition-all duration-300 ${
                  tier.featured
                    ? "bg-accent text-background hover:bg-accent/90"
                    : "border border-accent/50 text-accent hover:bg-accent/10"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-foreground/50 text-sm">
          Get started today and transform your office operations with DONNA
        </p>
      </div>
    </section>
  )
}
