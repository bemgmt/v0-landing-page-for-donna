"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CreditCard, Bot } from "lucide-react"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"
import { SettingsCard } from "@/components/din/settings/settings-card"
import { ToggleRow } from "@/components/din/settings/toggle-row"
import { generalSettings } from "@/lib/din/mock-data/settings"

const settingsLinks = [
  {
    href: "/din/settings/payment-profile",
    icon: <CreditCard className="w-6 h-6" />,
    title: "Payment Profile",
    description: "Manage billing, payout methods, and tax information",
  },
  {
    href: "/din/settings/automatic-bids",
    icon: <Bot className="w-6 h-6" />,
    title: "Automatic Bids",
    description: "Configure auto-bid rules, thresholds, and preferences",
  },
]

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Settings"
        subtitle="Manage your DIN preferences and configuration"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <GlowCard glowColor="cyan" className="p-6 h-full">
              <div className="flex items-start gap-4">
                <div className="text-white/30">{link.icon}</div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">{link.title}</h3>
                  <p className="text-xs text-white/40">{link.description}</p>
                </div>
              </div>
            </GlowCard>
          </Link>
        ))}
      </div>

      <div className="max-w-2xl space-y-6">
        <SettingsCard title="Notifications" description="Control how you receive DIN updates">
          {generalSettings.map((setting) => (
            <ToggleRow
              key={setting.id}
              label={setting.label}
              description={setting.description}
              defaultValue={setting.value as boolean}
            />
          ))}
        </SettingsCard>

        <SettingsCard title="Account Sync" description="Your DONNA account connection status">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-sm text-white/70">Profile synced from DONNA</p>
              <p className="text-xs text-white/30">Last synced: 4 minutes ago</p>
            </div>
          </div>
        </SettingsCard>
      </div>
    </motion.div>
  )
}
