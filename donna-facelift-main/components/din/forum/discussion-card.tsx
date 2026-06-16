import { MessageCircle, Clock } from "lucide-react"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"
import type { DiscussionThread } from "@/lib/din/types"

interface DiscussionCardProps {
  thread: DiscussionThread
}

export function DiscussionCard({ thread }: DiscussionCardProps) {
  return (
    <GlowCard className="p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-white/80 line-clamp-1">{thread.title}</h3>
            {thread.pinned && <TagPill variant="amber">Pinned</TagPill>}
            {thread.trending && <TagPill variant="cyan">Trending</TagPill>}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/35">
            <span>{thread.author}</span>
            <TagPill>{thread.category}</TagPill>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {thread.replies}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {thread.lastActivity}
          </span>
        </div>
      </div>
    </GlowCard>
  )
}
