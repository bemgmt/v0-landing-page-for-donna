"use client"

import { motion } from "framer-motion"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { ProfileSummaryCard } from "@/components/din/profile/profile-summary-card"
import { SkillsCard } from "@/components/din/profile/skills-card"
import { VerificationCard } from "@/components/din/profile/verification-card"
import { ProfileMetricsCard } from "@/components/din/profile/profile-metrics-card"
import { profileData } from "@/lib/din/mock-data/profile"

export default function ProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Profile"
        subtitle="Your DIN business profile — synced from your DONNA account"
      />

      <div className="space-y-6 max-w-4xl">
        <ProfileSummaryCard profile={profileData} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkillsCard skills={profileData.skills} categories={profileData.categories} />
          <div className="space-y-6">
            <VerificationCard certifications={profileData.certifications} />
          </div>
        </div>

        <ProfileMetricsCard metrics={profileData.metrics} />
      </div>
    </motion.div>
  )
}
