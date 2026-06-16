"use client"

import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { SectionShell } from "@/components/din/ui/section-shell"
import { ForumCategoryCard } from "@/components/din/forum/forum-category-card"
import { PinnedThreadCard } from "@/components/din/forum/pinned-thread-card"
import { DiscussionCard } from "@/components/din/forum/discussion-card"
import { forumCategories, discussionThreads } from "@/lib/din/mock-data/forum"

export default function ForumPage() {
  const pinnedThreads = discussionThreads.filter((t) => t.pinned)
  const regularThreads = discussionThreads.filter((t) => !t.pinned)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Discussion Forum"
        subtitle="Connect, share, and learn with the DIN community"
      >
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-sm text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors">
          <Plus className="w-4 h-4" />
          Start Discussion
        </button>
      </DinPageHeader>

      {pinnedThreads.length > 0 && (
        <SectionShell title="Pinned">
          <div className="space-y-2">
            {pinnedThreads.map((thread) => (
              <PinnedThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        </SectionShell>
      )}

      <SectionShell title="Categories">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {forumCategories.map((cat) => (
            <ForumCategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </SectionShell>

      <SectionShell title="Recent Discussions">
        <div className="space-y-2">
          {regularThreads.map((thread) => (
            <DiscussionCard key={thread.id} thread={thread} />
          ))}
        </div>
      </SectionShell>
    </motion.div>
  )
}
