"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { SettingsCard } from "@/components/din/settings/settings-card"
import { ToggleRow } from "@/components/din/settings/toggle-row"
import { TagPill } from "@/components/din/ui/tag-pill"
import { preferredCategories, excludedCategories } from "@/lib/din/mock-data/settings"

export default function AutomaticBidsPage() {
  const [fitThreshold, setFitThreshold] = useState(80)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Automatic Bids"
        subtitle="Configure DONNA to bid on your behalf"
      />

      <div className="max-w-2xl space-y-6">
        <SettingsCard title="Auto-Bid Configuration" description="Set rules for automatic bidding behavior">
          <ToggleRow
            label="Enable Automatic Bids"
            description="Allow DONNA to submit bids on your behalf when match criteria are met"
            defaultValue={false}
          />
          <ToggleRow
            label="Require Human Review"
            description="Get approval notification before auto-bids are submitted"
            defaultValue={true}
          />
        </SettingsCard>

        <SettingsCard title="Bid Limits" description="Set financial boundaries for auto-bids">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Minimum Bid</label>
              <input
                type="text"
                defaultValue="$1,000"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Maximum Bid</label>
              <input
                type="text"
                defaultValue="$5,000"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/30 transition-all"
              />
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium">Fit Threshold</label>
              <span className="text-sm text-cyan-300">{fitThreshold}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={fitThreshold}
              onChange={(e) => setFitThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Cooldown Window</label>
              <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 focus:outline-none focus:border-cyan-500/30 transition-all appearance-none">
                <option>1 hour</option>
                <option>2 hours</option>
                <option selected>4 hours</option>
                <option>8 hours</option>
                <option>24 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Max Bids Per Day</label>
              <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 focus:outline-none focus:border-cyan-500/30 transition-all appearance-none">
                <option>1</option>
                <option>3</option>
                <option selected>5</option>
                <option>10</option>
                <option>Unlimited</option>
              </select>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Category Preferences" description="Control which categories are eligible for auto-bids">
          <div className="mb-5">
            <p className="text-xs text-white/40 mb-2">Preferred Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {preferredCategories.map((cat) => (
                <TagPill key={cat} variant="emerald">{cat}</TagPill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-2">Excluded Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {excludedCategories.map((cat) => (
                <TagPill key={cat} variant="default">{cat}</TagPill>
              ))}
            </div>
          </div>
        </SettingsCard>

        <div className="flex items-center gap-3 pt-6 border-t border-white/[0.06]">
          <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/30 to-cyan-500/30 border border-violet-500/20 text-sm text-white hover:from-violet-500/40 hover:to-cyan-500/40 transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </motion.div>
  )
}
