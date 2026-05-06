"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { track } from "@vercel/analytics"
import { Shield, Lock, FileCheck } from "lucide-react"

const trustPillars = [
  {
    title: "Data Sovereignty",
    description: "Your client data is yours. DONNA never shares it or trains external models on your private information.",
    Icon: Shield,
  },
  {
    title: "Auditable Actions",
    description: "Every action, message, and workflow step is logged and auditable, ensuring you maintain full control.",
    Icon: FileCheck,
  },
  {
    title: "Compliance First",
    description: "Built to respect the fiduciary responsibility and licensing compliance required in real estate.",
    Icon: Lock,
  },
]

export default function SectionTrust() {
  const { ref, inView } = useInView({ threshold: 0.3, once: true })

  useEffect(() => {
    if (inView) {
      track("section_view", { section: "trust-governance" })
    }
  }, [inView])

  return (
    <section ref={ref} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-12">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-foreground/60">
            Trust & Governance
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight wow-glow">
            Your data is yours. <br />
            Everything is auditable.
          </h2>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            Real estate runs on trust and fiduciary responsibility. We built DONNA with the security, compliance, and sovereignty required to protect your business and your clients.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trustPillars.map(({ title, description, Icon }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-8 flex flex-col items-center text-center transition-all hover:bg-white/[0.05]">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <Icon className="h-7 w-7 text-accent shrink-0" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {title}
              </h3>
              <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
