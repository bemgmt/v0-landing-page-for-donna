"use client"

import { useFormContext } from "react-hook-form"
import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import TelnyxSettings from "./TelnyxSettings"
import CRMSettings from "./CRMSettings"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { IntegrationSettings } from "@/types/settings"

interface IntegrationCardProps {
  name: string
  description: string
  icon: string
  settings: IntegrationSettings
  settingsPath: string
  onConnect?: () => void
}

function IntegrationCard({ name, description, icon, settings, settingsPath, onConnect }: IntegrationCardProps) {
  const { setValue } = useFormContext()
  const getStatusIcon = () => {
    switch (settings.connectionStatus) {
      case "connected":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="p-4 glass border border-white/20 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-white/60">{description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-xs px-2 py-1 rounded ${
            settings.connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {settings.connectionStatus}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <SettingsFormField
          name={`${settingsPath}.enabled`}
          label="Enabled"
          description="Enable this integration"
          type="switch"
        />

        {settings.enabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SettingsFormField
                name={`${settingsPath}.readPermission`}
                label="Read Permission"
                description="Allow reading data"
                type="switch"
              />
              <SettingsFormField
                name={`${settingsPath}.writePermission`}
                label="Write Permission"
                description="Allow writing data"
                type="switch"
              />
            </div>

            <SettingsFormField
              name={`${settingsPath}.humanApprovalRequired`}
              label="Human Approval Required"
              description="Require human approval before actions"
              type="switch"
            />
          </>
        )}

        {settings.connectionStatus === 'disconnected' && (
          <button
            onClick={onConnect}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded text-sm transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  )
}

export default function ToolsIntegrationsSection() {
  const { watch } = useFormContext()
  const emailSettings = watch("integrations.email")
  const gmailPubSub = watch("integrations.email.gmailPubSub")

  return (
    <SettingsSectionWrapper
      title="Tools & Integrations"
      description="Configure what DONNA can access and interact with"
    >
      <div className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="email" className="border-white/20">
            <AccordionTrigger className="text-white">Email Integration</AccordionTrigger>
            <AccordionContent className="pt-4">
              <IntegrationCard
                name="Email"
                description="SMTP / Gmail / Exchange integration"
                icon="📧"
                settings={emailSettings}
                settingsPath="integrations.email"
                onConnect={() => {
                  // TODO: Implement Gmail OAuth flow
                  console.log("Connect Gmail")
                }}
              />

              {emailSettings.provider === "gmail" && (
                <div className="mt-4 p-4 glass border border-white/20 rounded-lg space-y-4">
                  <SettingsFormField
                    name="integrations.email.provider"
                    label="Email Provider"
                    description="Select your email provider"
                    type="select"
                    options={[
                      { value: "smtp", label: "SMTP" },
                      { value: "gmail", label: "Gmail" },
                      { value: "exchange", label: "Exchange" },
                    ]}
                  />

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <h5 className="text-sm font-medium mb-2">Gmail Pub/Sub (Future)</h5>
                    <SettingsFormField
                      name="integrations.email.gmailPubSub.enabled"
                      label="Enable Pub/Sub"
                      description="Use Google Pub/Sub for push notifications (future feature)"
                      type="switch"
                    />
                    {gmailPubSub?.enabled && (
                      <div className="mt-3 space-y-2">
                        <SettingsFormField
                          name="integrations.email.gmailPubSub.subscriptionId"
                          label="Subscription ID"
                          type="text"
                          placeholder="Enter subscription ID"
                        />
                        <SettingsFormField
                          name="integrations.email.gmailPubSub.topic"
                          label="Topic"
                          type="text"
                          placeholder="Enter topic name"
                        />
                        <SettingsFormField
                          name="integrations.email.gmailPubSub.pushEndpoint"
                          label="Push Endpoint URL"
                          type="text"
                          placeholder="https://your-domain.com/api/gmail/webhook"
                        />
                        <SettingsFormField
                          name="integrations.email.gmailPubSub.pollingFallback"
                          label="Polling Fallback"
                          description="Fall back to polling if Pub/Sub fails"
                          type="switch"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="calendar" className="border-white/20">
            <AccordionTrigger className="text-white">Calendar Integration</AccordionTrigger>
            <AccordionContent className="pt-4">
              <IntegrationCard
                name="Calendar"
                description="Sync calendar events"
                icon="📅"
                settings={watch("integrations.calendar")}
                settingsPath="integrations.calendar"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="crm" className="border-white/20">
            <AccordionTrigger className="text-white">CRM Integration</AccordionTrigger>
            <AccordionContent className="pt-4">
              <IntegrationCard
                name="CRM"
                description="Connect to your CRM system"
                icon="☁️"
                settings={watch("integrations.crm")}
                settingsPath="integrations.crm"
              />
              {watch("integrations.crm.enabled") && <CRMSettings />}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payments" className="border-white/20">
            <AccordionTrigger className="text-white">Payments Integration</AccordionTrigger>
            <AccordionContent className="pt-4">
              <IntegrationCard
                name="Payments"
                description="Payment processing integration"
                icon="💳"
                settings={watch("integrations.payments")}
                settingsPath="integrations.payments"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="forms" className="border-white/20">
            <AccordionTrigger className="text-white">Forms Integration</AccordionTrigger>
            <AccordionContent className="pt-4">
              <IntegrationCard
                name="Forms"
                description="Form submission handling"
                icon="📝"
                settings={watch("integrations.forms")}
                settingsPath="integrations.forms"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="zapier" className="border-white/20">
            <AccordionTrigger className="text-white">Zapier / Webhooks</AccordionTrigger>
            <AccordionContent className="pt-4">
              <IntegrationCard
                name="Zapier"
                description="Automate workflows with Zapier"
                icon="⚡"
                settings={watch("integrations.zapier")}
                settingsPath="integrations.zapier"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="telnyx" className="border-white/20">
            <AccordionTrigger className="text-white">Telnyx (Voice & SMS)</AccordionTrigger>
            <AccordionContent className="pt-4">
              <TelnyxSettings />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </SettingsSectionWrapper>
  )
}
