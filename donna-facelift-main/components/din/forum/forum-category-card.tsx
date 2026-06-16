import { MessageSquare } from "lucide-react"
import { GlowCard } from "@/components/din/ui/glow-card"
import type { ForumCategory } from "@/lib/din/types"

interface ForumCategoryCardProps {
  category: ForumCategory
}

export function ForumCategoryCard({ category }: ForumCategoryCardProps) {
  return (
    <GlowCard className="p-4 cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white/80">{category.name}</h3>
          <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{category.description}</p>
        </div>
        <span className="text-xs text-white/30 shrink-0">{category.threadCount}</span>
      </div>
    </GlowCard>
  )
}
