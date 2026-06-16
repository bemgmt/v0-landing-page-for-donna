"use client"

import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Checkbox } from "@/components/ui/checkbox"
import { useFormContext, Controller } from "react-hook-form"

interface AlertTypeConfigProps {
  name: string
  label: string
  description: string
  settingsPath: string
}

function AlertTypeConfig({ name, label, description, settingsPath }: AlertTypeConfigProps) {
  const { control, watch } = useFormContext()
  const enabled = watch(`${settingsPath}.enabled`)
  const deliveryMethods = watch(`${settingsPath}.deliveryMethods`) || []

  const deliveryOptions = [
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "dashboard", label: "Dashboard" },
    { value: "silent", label: "Silent log only" },
  ]

  return (
    <div className="p-4 glass border border-white/20 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-white/60">{description}</div>
        </div>
        <Controller
          name={`${settingsPath}.enabled`}
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      {enabled && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-sm font-medium">Delivery Methods</label>
          <div className="grid grid-cols-2 gap-2">
            {deliveryOptions.map((option) => (
              <Controller
                key={option.value}
                name={`${settingsPath}.deliveryMethods`}
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || []
                        if (checked) {
                          field.onChange([...current, option.value])
                        } else {
                          field.onChange(current.filter((v: string) => v !== option.value))
                        }
                      }}
                    />
                    <label className="text-sm">{option.label}</label>
                  </div>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NotificationsSection() {
  return (
    <SettingsSectionWrapper
      title="Notifications & Alerts"
      description="Configure when DONNA notifies you"
    >
      <div className="space-y-4">
        <AlertTypeConfig
          name="escalationAlerts"
          label="Escalation Alerts"
          description="Get notified when issues need human attention"
          settingsPath="notifications.escalationAlerts"
        />

        <AlertTypeConfig
          name="taskCompletion"
          label="Task Completion"
          description="Get notified when tasks are completed"
          settingsPath="notifications.taskCompletion"
        />

        <AlertTypeConfig
          name="errorsFailures"
          label="Errors / Failures"
          description="Get notified about errors and failures"
          settingsPath="notifications.errorsFailures"
        />

        <AlertTypeConfig
          name="newPatterns"
          label="New Patterns Discovered"
          description="Get notified when DONNA discovers new patterns"
          settingsPath="notifications.newPatterns"
        />

        <AlertTypeConfig
          name="weeklySummaries"
          label="Weekly Summaries"
          description="Receive weekly summary reports"
          settingsPath="notifications.weeklySummaries"
        />

        <div className="p-4 glass border border-blue-500/20 rounded-lg">
          <SettingsFormField
            name="notifications.telnyxSMSDelivery"
            label="Telnyx SMS Delivery"
            description="Use Telnyx for SMS delivery of critical alerts"
            type="switch"
          />
        </div>
      </div>
    </SettingsSectionWrapper>
  )
}
