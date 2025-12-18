"use client"

import { useInView } from "react-intersection-observer"

export default function Scale() {
  const { ref, inView } = useInView({ threshold: 0.1, once: true })

  return (
    <section id="scale" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-background/50">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Scale Without <span className="gradient-text">Limits</span>
          </h2>
        </div>

        {/* Body content */}
        <div className="space-y-6 text-center animate-slide-up">
          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            DONNA grows with your business. Start with one digital employee handling your core operations, then scale to multiple DONNAs across departments, locations, or business units.
          </p>

          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Whether you're a small business or a large enterprise, DONNA adapts to your needs. No hiring delays, no training periods, no capacity limits. Your digital workforce scales instantly.
          </p>

          <div className="glass-card p-6 rounded-xl text-left max-w-2xl mx-auto mt-8">
            <h3 className="text-xl font-bold mb-4 text-foreground">Scaling Benefits</h3>
            <ul className="space-y-3 text-foreground/80">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>Instant Deployment:</strong> Add new DONNAs in minutes, not months</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>No Capacity Limits:</strong> Handle thousands of conversations simultaneously</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>Cost Effective:</strong> Scale operations without scaling headcount</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <span><strong>Consistent Quality:</strong> Every DONNA maintains the same high standards</span>
              </li>
            </ul>
          </div>

          <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            From startup to enterprise, DONNA provides the same reliable, intelligent service at any scale.
          </p>
        </div>
      </div>
    </section>
  )
}

