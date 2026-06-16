"use client"

import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"

const ESCALATION_THRESHOLDS = [
  { value: "low", label: "Low - Escalate frequently" },
  { value: "medium", label: "Medium - Escalate when uncertain" },
  { value: "high", label: "High - Escalate only when necessary" },
  { value: "very-high", label: "Very High - Escalate rarely" },
]

export default function BehaviorPersonalitySection() {
  return (
    <SettingsSectionWrapper
      title="Behavior & Personality"
      description="Configure how DONNA thinks and responds"
    >
      <div className="space-y-6">
        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <SettingsFormField
            name="behavior.responseStyle"
            label="Response Style"
            description="How detailed DONNA's responses should be"
            type="radio"
            options={[
              { value: "concise", label: "Concise (short and to the point)" },
              { value: "balanced", label: "Balanced" },
              { value: "detailed", label: "Detailed (Longer response, but more context)" },
            ]}
          />

          <SettingsFormField
            name="behavior.confidenceLevel"
            label="Confidence Level"
            description="How confident DONNA should be when making decisions"
            type="radio"
            options={[
              { value: "conservative", label: "Conservative (asks before acting)" },
              { value: "balanced", label: "Balanced" },
              { value: "assertive", label: "Assertive (acts unless blocked)" },
            ]}
          />

          <SettingsFormField
            name="behavior.escalationThreshold"
            label="Escalation Threshold"
            description="When to ask for human help"
            type="select"
            options={ESCALATION_THRESHOLDS}
            placeholder="Select escalation threshold"
          />

          <SettingsFormField
            name="behavior.autonomyLevel"
            label="Allowed Autonomy Level"
            description="How much autonomy DONNA has to take actions"
            type="radio"
            options={[
              { value: "inform", label: "Inform only" },
              { value: "suggest", label: "Suggest actions" },
              { value: "execute", label: "Execute actions" },
            ]}
          />
        </div>
      </div>
    </SettingsSectionWrapper>
  )
}
