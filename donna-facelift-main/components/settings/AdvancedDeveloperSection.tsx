"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import AnalyticsSettings from "./AnalyticsSettings"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Plus, Trash2, RotateCcw } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function AdvancedDeveloperSection() {
  const { watch, setValue } = useFormContext()
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const apiKeys = watch("advanced.apiKeys") || []
  const webhooks = watch("advanced.webhooks") || []

  const handleToggleApiKey = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleGenerateApiKey = () => {
    const newKey = {
      id: Math.random().toString(36).substring(7),
      name: "New API Key",
      key: "sk_" + Math.random().toString(36).substring(2, 38),
      createdAt: new Date().toISOString(),
      permissions: ["read", "write"],
    }
    setValue("advanced.apiKeys", [...apiKeys, newKey])
  }

  const handleAddWebhook = () => {
    const newWebhook = {
      id: Math.random().toString(36).substring(7),
      url: "",
      events: [],
      enabled: true,
    }
    setValue("advanced.webhooks", [...webhooks, newWebhook])
  }

  const handleResetToDefault = () => {
    if (
      confirm(
        "Are you sure you want to reset DONNA to default settings? This will clear all customizations."
      )
    ) {
      // TODO: Implement reset to default
      alert("Reset to default functionality will be implemented")
    }
  }

  return (
    <div className="space-y-6">
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="w-full p-4 glass border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <h3 className="text-lg font-medium">Advanced / Developer</h3>
              <p className="text-sm text-white/60">Power + danger zone</p>
            </div>
            <ChevronDown className="w-5 h-5 text-white/60" />
          </div>
        </CollapsibleTrigger>

      <CollapsibleContent className="space-y-6">
        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">API Keys</h4>
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateApiKey}>
              <Plus className="w-4 h-4 mr-2" />
              Generate New Key
            </Button>
          </div>
          <div className="space-y-2">
            {apiKeys.map((key: any) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-2 bg-white/5 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{key.name}</div>
                  <div className="text-xs text-white/60">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-white/40 font-mono mt-1">
                    {showApiKeys[key.id] ? key.key : "•".repeat(40)}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleApiKey(key.id)}
                  className="p-2 hover:bg-white/10 rounded"
                >
                  {showApiKeys[key.id] ? (
                    <EyeOff className="w-4 h-4 text-white/60" />
                  ) : (
                    <Eye className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Webhooks</h4>
            <Button type="button" variant="outline" size="sm" onClick={handleAddWebhook}>
              <Plus className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </div>
          <div className="space-y-2">
            {webhooks.map((webhook: any, index: number) => (
              <div key={webhook.id} className="p-3 bg-white/5 rounded space-y-2">
                <SettingsFormField
                  name={`advanced.webhooks.${index}.url`}
                  label="Webhook URL"
                  type="text"
                  placeholder="https://your-domain.com/webhook"
                />
                <SettingsFormField
                  name={`advanced.webhooks.${index}.enabled`}
                  label="Enabled"
                  type="switch"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <SettingsFormField
            name="advanced.sandboxMode"
            label="Sandbox Mode"
            description="Enable sandbox mode for testing"
            type="switch"
          />
          <SettingsFormField
            name="advanced.debugLogsEnabled"
            label="Debug Logs"
            description="Enable detailed debug logging"
            type="switch"
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="performance" className="border-white/20">
            <AccordionTrigger className="text-white">Performance & Caching</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="p-3 bg-white/5 rounded space-y-3">
                <label className="text-sm font-medium">Redis Cache</label>
                <SettingsFormField
                  name="advanced.performance.redis.enabled"
                  label="Enable Redis"
                  type="switch"
                />
                <SettingsFormField
                  name="advanced.performance.redis.cacheTTL"
                  label="Cache TTL (seconds)"
                  type="number"
                  placeholder="3600"
                />
                <SettingsFormField
                  name="advanced.performance.redis.keyPrefix"
                  label="Key Prefix"
                  type="text"
                  placeholder="donna:"
                />
              </div>

              <div className="p-3 bg-white/5 rounded space-y-3">
                <label className="text-sm font-medium">Job Queue</label>
                <SettingsFormField
                  name="advanced.performance.jobQueue.provider"
                  label="Queue Provider"
                  type="select"
                  options={[
                    { value: "redis", label: "Redis" },
                    { value: "database", label: "Database" },
                    { value: "sqs", label: "AWS SQS" },
                    { value: "custom", label: "Custom" },
                  ]}
                />
                <SettingsFormField
                  name="advanced.performance.jobQueue.retrySettings.maxRetries"
                  label="Max Retries"
                  type="number"
                  placeholder="3"
                />
              </div>

              <SettingsFormField
                name="advanced.performance.optimization.cachingEnabled"
                label="Enable Caching"
                type="switch"
              />
              <SettingsFormField
                name="advanced.performance.optimization.cacheWarming"
                label="Cache Warming"
                type="switch"
              />
              <SettingsFormField
                name="advanced.performance.optimization.queryOptimization"
                label="Query Optimization"
                type="switch"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="analytics" className="border-white/20">
            <AccordionTrigger className="text-white">Analytics & APM</AccordionTrigger>
            <AccordionContent className="pt-4">
              <AnalyticsSettings />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="p-4 glass border border-red-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-red-400 mb-1">Reset DONNA to Default</h4>
              <p className="text-sm text-white/60">
                This will reset all settings to their default values
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={handleResetToDefault}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
