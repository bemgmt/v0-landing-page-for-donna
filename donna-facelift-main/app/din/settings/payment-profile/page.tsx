"use client"

import { motion } from "framer-motion"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { SettingsCard } from "@/components/din/settings/settings-card"
import { paymentProfileData } from "@/lib/din/mock-data/settings"

export default function PaymentProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Payment Profile"
        subtitle="Manage your billing and payout configuration"
      />

      <div className="max-w-2xl">
        <SettingsCard title="Business Information" description="Legal and billing details for your DIN account">
          <div className="space-y-5">
            <FormField label="Legal Business Name" value={paymentProfileData.legalBusinessName} />
            <FormField label="Billing Email" value={paymentProfileData.billingEmail} />
            <FormField label="Business Address" value={paymentProfileData.businessAddress} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Default Currency" value={paymentProfileData.defaultCurrency} />
              <FormField label="Tax Status" value={paymentProfileData.taxStatus} />
            </div>
          </div>
        </SettingsCard>

        <div className="mt-6">
          <SettingsCard title="Payout Method" description="How you receive payments from the DIN">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
              <p className="text-sm text-white/70">{paymentProfileData.payoutMethod}</p>
              <p className="text-xs text-white/30 mt-0.5">Connected and verified</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-sm text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors">
              Update Payout Method
            </button>
          </SettingsCard>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/30 to-cyan-500/30 border border-violet-500/20 text-sm text-white hover:from-violet-500/40 hover:to-cyan-500/40 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/30 transition-all"
      />
    </div>
  )
}
