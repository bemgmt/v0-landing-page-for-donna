"use client"

import { useFormContext } from "react-hook-form"
import { SettingsFormField } from "./SettingsFormField"
import { VerticalKey } from "@/lib/constants/verticals"

interface VerticalSpecificSettingsProps {
  vertical: VerticalKey
}

export default function VerticalSpecificSettings({ vertical }: VerticalSpecificSettingsProps) {
  const { watch } = useFormContext()

  switch (vertical) {
    case "hospitality":
      return (
        <div className="space-y-4">
          <SettingsFormField
            name="profile.verticalSpecific.hospitality.frontDeskAutomation"
            label="Front Desk Automation"
            description="Enable automated front desk interactions"
            type="switch"
          />

          <SettingsFormField
            name="profile.verticalSpecific.hospitality.reservationHandling"
            label="Reservation Handling"
            description="How DONNA handles reservation requests"
            type="select"
            options={[
              { value: "auto", label: "Fully Automated" },
              { value: "semi-auto", label: "Semi-Automated (with approval)" },
              { value: "manual", label: "Manual (inform only)" },
            ]}
          />

          <SettingsFormField
            name="profile.verticalSpecific.hospitality.conciergeInteractions"
            label="Concierge Interactions"
            description="Enable concierge-style interactions for guests"
            type="switch"
          />
        </div>
      )

    case "real_estate":
      return (
        <div className="space-y-4">
          <SettingsFormField
            name="profile.verticalSpecific.realEstate.leadQualificationRules"
            label="Lead Qualification Rules"
            description="Rules for qualifying real estate leads"
            type="textarea"
            placeholder="Enter lead qualification criteria..."
          />

          <SettingsFormField
            name="profile.verticalSpecific.realEstate.showingScheduling"
            label="Showing Scheduling"
            description="How DONNA handles showing scheduling requests"
            type="select"
            options={[
              { value: "auto", label: "Fully Automated" },
              { value: "semi-auto", label: "Semi-Automated (with approval)" },
              { value: "manual", label: "Manual (inform only)" },
            ]}
          />

          <SettingsFormField
            name="profile.verticalSpecific.realEstate.documentHandling"
            label="Document Handling"
            description="Enable automated document handling for real estate transactions"
            type="switch"
          />
        </div>
      )

    case "professional_services":
      return (
        <div className="space-y-4">
          <SettingsFormField
            name="profile.verticalSpecific.professionalServices.emailTriageRules"
            label="Email Triage Rules"
            description="Rules for automatically triaging incoming emails"
            type="textarea"
            placeholder="Enter email triage rules..."
          />

          <SettingsFormField
            name="profile.verticalSpecific.professionalServices.meetingNotes"
            label="Meeting Notes"
            description="Enable automatic meeting notes generation"
            type="switch"
          />

          <SettingsFormField
            name="profile.verticalSpecific.professionalServices.documentAutomation"
            label="Document Automation"
            description="Enable automated document creation and management"
            type="switch"
          />
        </div>
      )

    default:
      return null
  }
}
