import { GlowCard } from "@/components/din/ui/glow-card"

interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <GlowCard className="p-6">
      <div className="mb-5">
        <h3 className="text-base font-medium text-white/80">{title}</h3>
        {description && <p className="text-xs text-white/35 mt-0.5">{description}</p>}
      </div>
      {children}
    </GlowCard>
  )
}
