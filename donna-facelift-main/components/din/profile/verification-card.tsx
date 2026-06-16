import { Shield, CheckCircle } from "lucide-react"
import { GlowCard } from "@/components/din/ui/glow-card"

interface VerificationCardProps {
  certifications: string[]
}

export function VerificationCard({ certifications }: VerificationCardProps) {
  return (
    <GlowCard glowColor="emerald" className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-emerald-400/70" />
        <h3 className="text-sm font-medium text-white/70">Trust & Verification</h3>
      </div>
      <div className="space-y-3">
        {certifications.map((cert) => (
          <div key={cert} className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-white/60">{cert}</span>
          </div>
        ))}
      </div>
    </GlowCard>
  )
}
