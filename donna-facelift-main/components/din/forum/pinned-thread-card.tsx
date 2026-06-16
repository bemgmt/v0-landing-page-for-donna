import { Pin, MessageCircle } from "lucide-react"
import { GlowCard } from "@/components/din/ui/glow-card"
import type { DiscussionThread } from "@/lib/din/types"

interface PinnedThreadCardProps {
  thread: DiscussionThread
}

export function PinnedThreadCard({ thread }: PinnedThreadCardProps) {
  return (
    <GlowCard glowColor="amber" className="p-4 cursor-pointer">
      <div className="flex items-center gap-2 mb-2">
        <Pin className="w-3.5 h-3.5 text-amber-400/70" />
        <span className="text-[10px] text-amber-400/60 uppercase tracking-wider font-medium">Pinned</span>
      </div>
      <h3 className="text-sm font-medium text-white/80 mb-1">{thread.title}</h3>
      <div className="flex items-center gap-3 text-xs text-white/35">
        <span>{thread.author}</span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {thread.replies} replies
        </span>
        <span>{thread.lastActivity}</span>
      </div>
    </GlowCard>
  )
}
