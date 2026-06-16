"use client"

import { useFormContext } from "react-hook-form"
import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import VerticalSpecificSettings from "./VerticalSpecificSettings"
import { VERTICALS } from "@/lib/constants/verticals"
import { ProfileIdentitySettings } from "@/types/settings"

// Common timezones
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
]

// Common languages
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
]

// Industries
const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "retail", label: "Retail" },
  { value: "hospitality", label: "Hospitality" },
  { value: "real_estate", label: "Real Estate" },
  { value: "professional_services", label: "Professional Services" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
]

export default function ProfileIdentitySection() {
  const { watch } = useFormContext<{ profile: ProfileIdentitySettings }>()
  const vertical = watch("profile.vertical")
  const brandVoice = watch("profile.brandVoice")
  const planTier = watch("billing.planTier") // Assuming this is available in form context

  const verticalOptions = [
    { value: "none", label: "None" },
    ...VERTICALS.map((v) => ({ value: v.key, label: v.label })),
  ]

  return (
    <SettingsSectionWrapper
      title="Profile & Identity"
      description="Configure who this DONNA is and how it identifies itself"
    >
      <div className="space-y-6">
        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <SettingsFormField
            name="profile.donnaName"
            label="DONNA Name"
            description="The name for this DONNA instance (default: DONNA, but re-nameable per org)"
            type="text"
            placeholder="DONNA"
          />

          <SettingsFormField
            name="profile.businessName"
            label="Business Name"
            description="Your organization's name"
            type="text"
            placeholder="Your Business Name"
          />

          <SettingsFormField
            name="profile.primaryContact"
            label="Primary Contact / Owner"
            description="The primary contact person for this DONNA instance"
            type="text"
            placeholder="John Doe"
          />

          <SettingsFormField
            name="profile.industry"
            label="Industry"
            description="Your business industry"
            type="select"
            options={INDUSTRIES}
            placeholder="Select industry"
          />

          <SettingsFormField
            name="profile.vertical"
            label="Industry / Vertical"
            description="Select a vertical for industry-specific features"
            type="select"
            options={verticalOptions}
            placeholder="Select vertical"
          />

          <SettingsFormField
            name="profile.timezone"
            label="Timezone"
            description="Your business timezone"
            type="select"
            options={TIMEZONES}
            placeholder="Select timezone"
          />

          <SettingsFormField
            name="profile.language"
            label="Language Preferences"
            description="Primary language for DONNA interactions"
            type="select"
            options={LANGUAGES}
            placeholder="Select language"
          />

          <SettingsFormField
            name="profile.brandVoice"
            label="Brand Voice Preset"
            description="The personality and tone DONNA uses in communications"
            type="radio"
            options={[
              { value: "professional", label: "Professional" },
              { value: "friendly", label: "Friendly" },
              { value: "donna", label: "DONNA" },
              { value: "custom", label: "Custom (Pro & Enterprise Tiers)" },
            ]}
          />

          {brandVoice === "custom" && (planTier === "pro" || planTier === "enterprise") && (
            <SettingsFormField
              name="profile.customBrandVoice"
              label="Custom Brand Voice"
              description="Define your custom brand voice instructions"
              type="textarea"
              placeholder="Enter custom brand voice instructions..."
            />
          )}

          {brandVoice === "custom" && planTier !== "pro" && planTier !== "enterprise" && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300">
              Custom brand voice is available for Pro and Enterprise tiers only.{" "}
              <a href="/billing" className="underline hover:text-yellow-200">
                Upgrade now
              </a>
            </div>
          )}
        </div>

        {/* Vertical-Specific Configuration */}
        {vertical && (
          <div className="p-4 glass border border-white/20 rounded-lg">
            <h4 className="text-md font-medium mb-4">Vertical-Specific Configuration</h4>
            <VerticalSpecificSettings vertical={vertical} />
          </div>
        )}
      </div>
    </SettingsSectionWrapper>
  )
}
