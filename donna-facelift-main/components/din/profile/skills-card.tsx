import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"

interface SkillsCardProps {
  skills: string[]
  categories: string[]
}

export function SkillsCard({ skills, categories }: SkillsCardProps) {
  return (
    <GlowCard className="p-6">
      <h3 className="text-sm font-medium text-white/70 mb-4">Core Skills</h3>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {skills.map((skill) => (
          <TagPill key={skill} variant="cyan">{skill}</TagPill>
        ))}
      </div>

      <h3 className="text-sm font-medium text-white/70 mb-3">Service Categories</h3>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <TagPill key={cat} variant="violet">{cat}</TagPill>
        ))}
      </div>
    </GlowCard>
  )
}
