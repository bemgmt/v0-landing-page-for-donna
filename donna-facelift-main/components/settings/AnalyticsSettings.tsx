"use client"

import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function AnalyticsSettings() {
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tracing" className="border-white/20">
          <AccordionTrigger className="text-white">Tracing Configuration</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="advanced.analytics.tracing.enabled"
              label="Enable Tracing"
              description="Enable distributed tracing"
              type="switch"
            />
            <SettingsFormField
              name="advanced.analytics.tracing.samplingRate"
              label="Sampling Rate (%)"
              description="Percentage of requests to trace (0-100)"
              type="number"
              placeholder="10"
            />
            <SettingsFormField
              name="advanced.analytics.tracing.retentionPeriod"
              label="Retention Period (days)"
              description="How long to keep trace data"
              type="number"
              placeholder="7"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sla" className="border-white/20">
          <AccordionTrigger className="text-white">SLA Threshold Settings</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="advanced.analytics.sla.responseTimeThreshold"
              label="Response Time Threshold (ms)"
              description="Maximum acceptable response time"
              type="number"
              placeholder="1000"
            />
            <SettingsFormField
              name="advanced.analytics.sla.errorRateThreshold"
              label="Error Rate Threshold (%)"
              description="Maximum acceptable error rate"
              type="number"
              placeholder="1"
            />
            <SettingsFormField
              name="advanced.analytics.sla.uptimeRequirement"
              label="Uptime Requirement (%)"
              description="Minimum required uptime"
              type="number"
              placeholder="99.9"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="monitoring" className="border-white/20">
          <AccordionTrigger className="text-white">Performance Monitoring</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="advanced.analytics.performanceMonitoring.enabled"
              label="Enable APM"
              description="Enable Application Performance Monitoring"
              type="switch"
            />
            <SettingsFormField
              name="advanced.analytics.performanceMonitoring.metricsCollectionInterval"
              label="Metrics Collection Interval (seconds)"
              description="How often to collect metrics"
              type="number"
              placeholder="60"
            />
            <div className="p-3 bg-white/5 rounded space-y-2">
              <label className="text-sm font-medium">Alert Thresholds</label>
              <SettingsFormField
                name="advanced.analytics.performanceMonitoring.alertThresholds.cpu"
                label="CPU Threshold (%)"
                type="number"
                placeholder="80"
              />
              <SettingsFormField
                name="advanced.analytics.performanceMonitoring.alertThresholds.memory"
                label="Memory Threshold (%)"
                type="number"
                placeholder="80"
              />
              <SettingsFormField
                name="advanced.analytics.performanceMonitoring.alertThresholds.responseTime"
                label="Response Time Threshold (ms)"
                type="number"
                placeholder="2000"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dashboard" className="border-white/20">
          <AccordionTrigger className="text-white">Dashboard Customization</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="advanced.analytics.dashboard.defaultLayout"
              label="Default Layout"
              description="Default dashboard layout"
              type="select"
              options={[
                { value: "grid", label: "Grid" },
                { value: "list", label: "List" },
                { value: "custom", label: "Custom" },
              ]}
            />
            <SettingsFormField
              name="advanced.analytics.dashboard.reportGenerationSchedule"
              label="Report Generation Schedule"
              description="Cron expression for report generation"
              type="text"
              placeholder="0 0 * * 0"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sentry" className="border-white/20">
          <AccordionTrigger className="text-white">Sentry Integration</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <SettingsFormField
              name="advanced.analytics.sentry.errorTracking"
              label="Error Tracking"
              description="Enable Sentry error tracking"
              type="switch"
            />
            <SettingsFormField
              name="advanced.analytics.sentry.performanceMonitoring"
              label="Performance Monitoring"
              description="Enable Sentry performance monitoring"
              type="switch"
            />
            <SettingsFormField
              name="advanced.analytics.sentry.releaseTracking"
              label="Release Tracking"
              description="Track releases in Sentry"
              type="switch"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
