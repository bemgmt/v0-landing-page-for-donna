"use client"

import { motion } from "framer-motion"
import { CheckCircle, Zap } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"
import { TagPill } from "@/components/din/ui/tag-pill"
import type { MatchProfile } from "@/lib/din/types"

const suggestedMatches: MatchProfile[] = [
  {
    id: "m1",
    companyName: "Northstar Ops Collective",
    industry: "Workflow Automation",
    matchedSkills: ["Process Design", "Zapier", "CRM", "Automation"],
    fitScore: 94,
    responseSpeed: "18 min avg",
    verified: true,
    whyMatch: "Strong category overlap with your recent requests and preferred skill set",
    tags: ["Verified DONNA Node", "Fast Responder"],
  },
  {
    id: "m2",
    companyName: "Blue Harbor Automation",
    industry: "Software Development",
    matchedSkills: ["API Integration", "Automation", "Testing", "Node.js"],
    fitScore: 88,
    responseSpeed: "22 min avg",
    verified: true,
    whyMatch: "Matched based on recent network demand signals and your activity",
    tags: ["Verified DONNA Node", "Strong Category Match"],
  },
  {
    id: "m3",
    companyName: "Meridian Research Group",
    industry: "Market Research",
    matchedSkills: ["Data Analysis", "Strategy", "Competitive Intel"],
    fitScore: 82,
    responseSpeed: "35 min avg",
    verified: true,
    whyMatch: "Specializes in tech sector research matching your open requests",
    tags: ["Verified DONNA Node"],
  },
  {
    id: "m4",
    companyName: "Crestline Real Estate Support",
    industry: "Real Estate Ops",
    matchedSkills: ["Lead Routing", "CRM", "Real Estate", "Scheduling"],
    fitScore: 79,
    responseSpeed: "28 min avg",
    verified: false,
    whyMatch: "Regional match with high demand overlap in real estate operations",
    tags: ["Strong Category Match"],
  },
]

export default function SuggestedMatchesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Suggested Matches"
        subtitle="DIN-recommended providers based on your profile and network activity"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestedMatches.map((match) => (
          <GlowCard key={match.id} glowColor="violet" className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-medium text-white">{match.companyName}</h3>
                  {match.verified && (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-white/40">{match.industry}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-light text-white">{match.fitScore}%</p>
                <p className="text-[10px] text-white/35">fit score</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {match.matchedSkills.map((skill) => (
                <TagPill key={skill} variant="cyan">{skill}</TagPill>
              ))}
            </div>

            <p className="text-xs text-white/40 mb-4">{match.whyMatch}</p>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-1.5">
                {match.tags.map((tag) => (
                  <TagPill key={tag} variant="emerald">{tag}</TagPill>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400/70">
                <Zap className="w-3 h-3" />
                <span>{match.responseSpeed}</span>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </motion.div>
  )
}
