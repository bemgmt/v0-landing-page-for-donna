import { CheckCircle, MapPin, Clock } from "lucide-react"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"
import type { ProfileData } from "@/lib/din/types"

interface ProfileSummaryCardProps {
  profile: ProfileData
}

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  return (
    <GlowCard glowColor="violet" className="p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-400/30 border border-white/[0.08] flex items-center justify-center text-xl font-light text-white shrink-0">
          {profile.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-white">{profile.name}</h2>
            {profile.verified && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          </div>
          <p className="text-sm text-white/50">{profile.company}</p>
          <div className="flex items-center gap-3 mt-2">
            <TagPill variant="emerald">Verified DONNA Node</TagPill>
            <span className="text-[10px] text-white/30">Profile synced from DONNA</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/50 leading-relaxed mb-5">{profile.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-white/[0.06]">
        <MiniStat label="Match Quality" value={profile.matchQuality} />
        <MiniStat label="Avg. Response" value={profile.avgResponse} icon={<Clock className="w-3 h-3 text-cyan-400/70" />} />
        <MiniStat label="Budget Range" value={`$${(profile.preferredBudgetMin / 1000).toFixed(0)}k – $${(profile.preferredBudgetMax / 1000).toFixed(0)}k`} />
        <MiniStat label="Coverage" value={`${profile.coverageRegions.length} regions`} icon={<MapPin className="w-3 h-3 text-violet-400/70" />} />
      </div>
    </GlowCard>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-sm text-white/80">{value}</span>
      </div>
    </div>
  )
}
