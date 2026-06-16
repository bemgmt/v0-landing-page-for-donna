"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { SettingsFormField } from "./SettingsFormField"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function TelnyxSettings() {
  const { watch } = useFormContext()
  const connectionStatus = watch("integrations.telnyx.connectionStatus")
  const [testingConnection, setTestingConnection] = useState(false)

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      // TODO: Implement actual connection test
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Connection test error:", error)
    } finally {
      setTestingConnection(false)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 glass border border-white/20 rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="font-medium">Telnyx Connection</div>
            <div className="text-sm text-white/60">
              Status: {connectionStatus === "connected" ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          disabled={testingConnection}
        >
          {testingConnection ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="voice" className="border-white/20">
          <AccordionTrigger className="text-white">Voice Configuration</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="integrations.telnyx.voice.apiKey"
              label="API Key"
              description="Your Telnyx API key (masked for security)"
              type="password"
              placeholder="Enter API key"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.connectionId"
              label="Connection ID"
              description="Telnyx connection ID for voice calls"
              type="text"
              placeholder="Enter connection ID"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.phoneNumber"
              label="Phone Number"
              description="Primary phone number for voice calls"
              type="text"
              placeholder="+1234567890"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.inboundNumber"
              label="Inbound Number"
              description="Phone number for receiving calls"
              type="text"
              placeholder="+1234567890"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.outboundNumber"
              label="Outbound Number"
              description="Phone number for making calls"
              type="text"
              placeholder="+1234567890"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.webhookUrl"
              label="Webhook URL"
              description="URL for receiving Telnyx webhook events"
              type="text"
              placeholder="https://your-domain.com/api/telnyx/webhook"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.callRecording"
              label="Call Recording"
              description="Enable automatic call recording"
              type="switch"
            />

            <SettingsFormField
              name="integrations.telnyx.voice.recordingStorageLocation"
              label="Recording Storage Location"
              description="Where to store call recordings"
              type="text"
              placeholder="s3://bucket-name/recordings"
            />

            <div className="p-3 bg-white/5 rounded space-y-2">
              <label className="text-sm font-medium">Call Control Preferences</label>
              <SettingsFormField
                name="integrations.telnyx.voice.callControlPreferences.autoAnswer"
                label="Auto Answer"
                description="Automatically answer incoming calls"
                type="switch"
              />
              <SettingsFormField
                name="integrations.telnyx.voice.callControlPreferences.autoHangup"
                label="Auto Hangup"
                description="Automatically hangup after call completion"
                type="switch"
              />
              <SettingsFormField
                name="integrations.telnyx.voice.callControlPreferences.transferRules"
                label="Transfer Rules"
                description="Rules for call transfers"
                type="textarea"
                placeholder="Enter transfer rules..."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sms" className="border-white/20">
          <AccordionTrigger className="text-white">SMS/MMS Configuration</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="integrations.telnyx.sms.messagingProfileId"
              label="Messaging Profile ID"
              description="Telnyx messaging profile ID"
              type="text"
              placeholder="Enter messaging profile ID"
            />

            <SettingsFormField
              name="integrations.telnyx.sms.phoneNumber"
              label="Phone Number"
              description="Phone number for SMS/MMS"
              type="text"
              placeholder="+1234567890"
            />

            <SettingsFormField
              name="integrations.telnyx.sms.deliveryStatusTracking"
              label="Delivery Status Tracking"
              description="Track SMS delivery status"
              type="switch"
            />

            <SettingsFormField
              name="integrations.telnyx.sms.mmsSupport"
              label="MMS Support"
              description="Enable MMS (multimedia messaging) support"
              type="switch"
            />

            <SettingsFormField
              name="integrations.telnyx.sms.webhookUrl"
              label="Webhook URL"
              description="URL for receiving SMS/MMS webhook events"
              type="text"
              placeholder="https://your-domain.com/api/telnyx/webhook"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
