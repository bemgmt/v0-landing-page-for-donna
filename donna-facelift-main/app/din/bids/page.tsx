"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Gavel, AlertTriangle, History } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"

const bidSections = [
  {
    href: "/din/bids/pending",
    icon: <Gavel className="w-8 h-8" />,
    title: "Pending",
    description: "Bids awaiting a decision from the requesting party",
    count: 3,
    glowColor: "cyan" as const,
  },
  {
    href: "/din/bids/closing-soon",
    icon: <AlertTriangle className="w-8 h-8" />,
    title: "Closing Soon",
    description: "Opportunities closing within the next hour",
    count: 3,
    glowColor: "amber" as const,
  },
  {
    href: "/din/bids/previous",
    icon: <History className="w-8 h-8" />,
    title: "Previous Bids",
    description: "Completed bids — won and lost outcomes",
    count: 5,
    glowColor: "violet" as const,
  },
]

export default function BidsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader title="My Bids" subtitle="Track submitted bids and bid outcomes" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bidSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <GlowCard glowColor={section.glowColor} className="h-full p-8 text-center">
              <div className="flex justify-center mb-4 text-white/40">{section.icon}</div>
              <h3 className="text-lg font-light text-white mb-1">{section.title}</h3>
              <p className="text-2xl font-light text-white/70 mb-2">{section.count}</p>
              <p className="text-sm text-white/40">{section.description}</p>
            </GlowCard>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
