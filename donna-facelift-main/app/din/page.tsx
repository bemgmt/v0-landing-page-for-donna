"use client"

import { motion } from "framer-motion"
import { WelcomeHero } from "@/components/din/dashboard/welcome-hero"
import { AnalyticsCards } from "@/components/din/dashboard/analytics-cards"
import { ActiveBidsPanel } from "@/components/din/dashboard/active-bids-panel"
import { DinNewsPanel } from "@/components/din/dashboard/din-news-panel"
import { SuggestedMatchesPanel } from "@/components/din/dashboard/suggested-matches-panel"

export default function DinDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <WelcomeHero />
      <AnalyticsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActiveBidsPanel />
        </div>
        <div className="space-y-6">
          <DinNewsPanel />
          <SuggestedMatchesPanel />
        </div>
      </div>
    </motion.div>
  )
}
