"use client"

import { motion } from "framer-motion"
import { IntelligenceHero } from "@/components/din/intelligence/intelligence-hero"
import { MarketSignalCard } from "@/components/din/intelligence/market-signal-card"
import { TrendCard } from "@/components/din/intelligence/trend-card"
import { SectionShell } from "@/components/din/ui/section-shell"
import { trendOverview, marketSignals, trendGraphData } from "@/lib/din/mock-data/intelligence"

export default function IntelligencePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <IntelligenceHero />

      <SectionShell title="Market Signals" subtitle="Key observations from the DIN">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketSignals.map((signal) => (
            <MarketSignalCard key={signal.id} label={signal.label} value={signal.value} detail={signal.detail} />
          ))}
        </div>
      </SectionShell>

      <SectionShell title="Rising Trends" subtitle="Categories and skills gaining momentum">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendOverview.map((trend) => (
            <TrendCard key={trend.id} trend={trend} graphData={trendGraphData[trend.id]} />
          ))}
        </div>
      </SectionShell>
    </motion.div>
  )
}
