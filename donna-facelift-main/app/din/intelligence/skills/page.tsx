"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { SkillCard } from "@/components/din/intelligence/skill-card"
import { SectionShell } from "@/components/din/ui/section-shell"
import { mySkills, newSkills, updatedSkills } from "@/lib/din/mock-data/intelligence"

const PAGE_SIZE = 9

function PaginatedSkillGrid({
  title,
  subtitle,
  skills,
  ownedIds,
  onAdd,
}: {
  title: string
  subtitle: string
  skills: typeof newSkills
  ownedIds: Set<string>
  onAdd: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)

  const previewCount = 3
  const totalPages = Math.ceil(skills.length / PAGE_SIZE)
  const visibleSkills = expanded ? skills.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) : skills.slice(0, previewCount)

  return (
    <SectionShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-light text-white/90">{title}</h2>
          <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => { setExpanded(!expanded); setPage(0) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
        >
          <span>{expanded ? "Show less" : "View all"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={expanded ? `page-${page}` : "preview"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {visibleSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isOwned={ownedIds.has(skill.id)}
              onAdd={onAdd}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {expanded && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                  i === page
                    ? "bg-white/[0.12] text-white border border-white/[0.12]"
                    : "text-white/40 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </SectionShell>
  )
}

export default function SkillsPage() {
  const [addedIds, setAddedIds] = useState<Set<string>>(() => {
    return new Set(mySkills.map((s) => s.id))
  })

  const handleAdd = (id: string) => {
    setAddedIds((prev) => new Set(prev).add(id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Skills"
        subtitle="Manage your skills, discover new ones, and track updates"
      />

      <SectionShell title="My Skills" subtitle="Skills downloaded to your DONNA">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySkills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} isOwned={true} />
          ))}
        </div>
      </SectionShell>

      <PaginatedSkillGrid
        title="New Skills"
        subtitle="Newly emerging skills across the DONNA Intelligence Network"
        skills={newSkills}
        ownedIds={addedIds}
        onAdd={handleAdd}
      />

      <PaginatedSkillGrid
        title="Updated Skills"
        subtitle="Skills with shifting demand and recent movement"
        skills={updatedSkills}
        ownedIds={addedIds}
        onAdd={handleAdd}
      />
    </motion.div>
  )
}
