import { GlowCard } from "@/components/din/ui/glow-card"

interface MarketSignalCardProps {
  label: string
  value: string
  detail: string
}

export function MarketSignalCard({ label, value, detail }: MarketSignalCardProps) {
  return (
    <GlowCard glowColor="violet" className="p-5">
      <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-2">{label}</p>
      <p className="text-base font-medium text-white mb-1">{value}</p>
      <p className="text-xs text-white/40">{detail}</p>
    </GlowCard>
  )
}
