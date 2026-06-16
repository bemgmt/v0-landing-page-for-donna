import { dinNews } from "@/lib/din/mock-data/dashboard"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"

export function DinNewsPanel() {
  return (
    <div>
      <h2 className="text-lg font-light text-white/90 mb-4">DIN News</h2>
      <div className="space-y-2">
        {dinNews.map((item) => (
          <GlowCard key={item.id} className="p-3.5" hover={false}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{item.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {item.category && (
                    <TagPill variant="violet">{item.category}</TagPill>
                  )}
                  <span className="text-[10px] text-white/30">{item.timestamp}</span>
                </div>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}
