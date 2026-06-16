"use client"

import { useFormContext } from "react-hook-form"
import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChannelSettings, BusinessHours } from "@/types/settings"

interface ChannelConfigProps {
  channelName: string
  channelPath: string
  settings: ChannelSettings
}

function ChannelConfig({ channelName, channelPath, settings }: ChannelConfigProps) {
  return (
    <div className="space-y-4">
      <SettingsFormField
        name={`${channelPath}.enabled`}
        label={`Enable ${channelName}`}
        description={`Allow DONNA to interact via ${channelName}`}
        type="switch"
      />

      {settings.enabled && (
        <>
          <SettingsFormField
            name={`${channelPath}.toneOverride`}
            label="Tone Override"
            description="Override default tone for this channel"
            type="textarea"
            placeholder="Enter tone override instructions..."
          />

          <div className="p-3 bg-white/5 rounded space-y-2">
            <label className="text-sm font-medium">Business Hours</label>
            <SettingsFormField
              name={`${channelPath}.businessHours.enabled`}
              label="Enable Business Hours"
              type="switch"
            />
            {/* TODO: Add day-by-day business hours picker */}
          </div>

          <SettingsFormField
            name={`${channelPath}.autoReplyRules`}
            label="Auto-Reply Rules"
            description="Rules for automatic replies on this channel"
            type="textarea"
            placeholder="Enter auto-reply rules..."
          />

          <SettingsFormField
            name={`${channelPath}.escalationPath`}
            label="Escalation Path"
            description="How to escalate issues on this channel"
            type="textarea"
            placeholder="Enter escalation path..."
          />

          <SettingsFormField
            name={`${channelPath}.signature`}
            label="Signature / Closing Style"
            description="How DONNA should sign off on this channel"
            type="textarea"
            placeholder="Enter signature/closing style..."
          />
        </>
      )}
    </div>
  )
}

export default function CommunicationChannelsSection() {
  const { watch } = useFormContext()
  const webrtcSettings = watch("channels.webrtc")
  const telnyxChannels = watch("channels.telnyxChannels")

  return (
    <SettingsSectionWrapper
      title="Communication Channels"
      description="Configure where DONNA shows up and how it communicates"
    >
      <div className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="website" className="border-white/20">
            <AccordionTrigger className="text-white">Website Chat</AccordionTrigger>
            <AccordionContent className="pt-4">
              <ChannelConfig
                channelName="Website Chat"
                channelPath="channels.websiteChat"
                settings={watch("channels.websiteChat")}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sms" className="border-white/20">
            <AccordionTrigger className="text-white">SMS</AccordionTrigger>
            <AccordionContent className="pt-4">
              <ChannelConfig
                channelName="SMS"
                channelPath="channels.sms"
                settings={watch("channels.sms")}
              />
              {watch("channels.sms.enabled") && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded space-y-2">
                  <label className="text-sm font-medium">Telnyx SMS Settings</label>
                  <SettingsFormField
                    name="channels.telnyxChannels.sms.messagingProfile"
                    label="Messaging Profile"
                    type="text"
                    placeholder="Enter messaging profile"
                  />
                  <SettingsFormField
                    name="channels.telnyxChannels.sms.deliveryConfirmation"
                    label="Delivery Confirmation"
                    description="Require delivery confirmation"
                    type="switch"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="email" className="border-white/20">
            <AccordionTrigger className="text-white">Email</AccordionTrigger>
            <AccordionContent className="pt-4">
              <ChannelConfig
                channelName="Email"
                channelPath="channels.email"
                settings={watch("channels.email")}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="voice" className="border-white/20">
            <AccordionTrigger className="text-white">Voice</AccordionTrigger>
            <AccordionContent className="pt-4">
              <ChannelConfig
                channelName="Voice"
                channelPath="channels.voice"
                settings={watch("channels.voice")}
              />
              {watch("channels.voice.enabled") && (
                <>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded space-y-2">
                    <label className="text-sm font-medium">Telnyx Voice Settings</label>
                    <SettingsFormField
                      name="channels.telnyxChannels.voice.phoneNumber"
                      label="Phone Number"
                      type="text"
                      placeholder="+1234567890"
                    />
                    <SettingsFormField
                      name="channels.telnyxChannels.voice.callRoutingRules"
                      label="Call Routing Rules"
                      type="textarea"
                      placeholder="Enter call routing rules..."
                    />
                    <SettingsFormField
                      name="channels.telnyxChannels.voice.recordingPreferences"
                      label="Recording Preferences"
                      type="select"
                      options={[
                        { value: "always", label: "Always Record" },
                        { value: "on-demand", label: "On Demand" },
                        { value: "never", label: "Never Record" },
                      ]}
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dashboard" className="border-white/20">
            <AccordionTrigger className="text-white">Internal Dashboard</AccordionTrigger>
            <AccordionContent className="pt-4">
              <ChannelConfig
                channelName="Dashboard"
                channelPath="channels.dashboard"
                settings={watch("channels.dashboard")}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="webrtc" className="border-white/20">
            <AccordionTrigger className="text-white">Real-time Voice / WebRTC</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <SettingsFormField
                name="channels.webrtc.vadEnabled"
                label="Voice Activity Detection (VAD)"
                description="Enable automatic voice activity detection"
                type="switch"
              />

              <div className="p-3 bg-white/5 rounded space-y-3">
                <label className="text-sm font-medium">Reconnection Settings</label>
                <SettingsFormField
                  name="channels.webrtc.reconnection.maxRetries"
                  label="Max Retry Attempts"
                  description="Maximum number of reconnection attempts"
                  type="number"
                  placeholder="5"
                />
                <SettingsFormField
                  name="channels.webrtc.reconnection.backoffStrategy"
                  label="Backoff Strategy"
                  description="Strategy for reconnection delays"
                  type="select"
                  options={[
                    { value: "exponential", label: "Exponential" },
                    { value: "linear", label: "Linear" },
                  ]}
                />
                <SettingsFormField
                  name="channels.webrtc.reconnection.timeout"
                  label="Reconnection Timeout (ms)"
                  description="Timeout before giving up on reconnection"
                  type="number"
                  placeholder="30000"
                />
              </div>

              <div className="p-3 bg-white/5 rounded space-y-3">
                <SettingsFormField
                  name="channels.webrtc.websocketProxy.enabled"
                  label="WebSocket Proxy"
                  description="Enable WebSocket proxy (if retained)"
                  type="switch"
                />
                {webrtcSettings?.websocketProxy?.enabled && (
                  <>
                    <SettingsFormField
                      name="channels.webrtc.websocketProxy.url"
                      label="Proxy URL"
                      type="text"
                      placeholder="wss://proxy.example.com"
                    />
                    <SettingsFormField
                      name="channels.webrtc.websocketProxy.authentication"
                      label="Authentication"
                      type="text"
                      placeholder="Enter authentication token"
                    />
                    <SettingsFormField
                      name="channels.webrtc.websocketProxy.rateLimiting"
                      label="Rate Limiting"
                      description="Enable rate limiting on proxy"
                      type="switch"
                    />
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </SettingsSectionWrapper>
  )
}
