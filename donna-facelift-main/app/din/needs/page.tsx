"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { FileText, Search, Sparkles } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"

const navCards = [
  {
    href: "/din/needs/submit-request",
    icon: <FileText className="w-8 h-8" />,
    title: "Submit a Request",
    description: "Post a new project need to the network. Describe scope, budget, and skills required.",
    glowColor: "violet" as const,
  },
  {
    href: "/din/needs/open-bids",
    icon: <Search className="w-8 h-8" />,
    title: "Search Open Bids",
    description: "Browse the live bid board. Filter by category, budget, skills, and urgency.",
    glowColor: "cyan" as const,
  },
  {
    href: "/din/needs/suggested-matches",
    icon: <Sparkles className="w-8 h-8" />,
    title: "View Suggested Matches",
    description: "DIN-recommended providers and opportunities based on your profile and activity.",
    glowColor: "emerald" as const,
  },
]

export default function NeedsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="I Need A…"
        subtitle="Find what you need or post what you offer"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {navCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <GlowCard glowColor={card.glowColor} className="h-full p-8 text-center">
              <div className="flex justify-center mb-4 text-white/40">{card.icon}</div>
              <h3 className="text-lg font-light text-white mb-2">{card.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{card.description}</p>
            </GlowCard>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
