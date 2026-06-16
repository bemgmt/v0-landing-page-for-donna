"use client"

import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Button } from "@/components/ui/button"
import { Download, Trash2, ExternalLink } from "lucide-react"

export default function PrivacySecuritySection() {
  const handleExportData = () => {
    // TODO: Implement data export
    alert("Data export functionality will be implemented")
  }

  const handleDeleteData = () => {
    if (
      confirm(
        "Are you sure you want to delete all data? This action cannot be undone."
      )
    ) {
      // TODO: Implement data deletion
      alert("Data deletion functionality will be implemented")
    }
  }

  return (
    <SettingsSectionWrapper
      title="Privacy, Security & Governance"
      description="Configure trust and security settings"
    >
      <div className="space-y-6">
        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <SettingsFormField
            name="privacy.dataRetentionPolicy"
            label="Data Retention Policy"
            description="How long to retain data"
            type="select"
            options={[
              { value: "30days", label: "30 Days" },
              { value: "90days", label: "90 Days" },
              { value: "1year", label: "1 Year" },
              { value: "indefinite", label: "Indefinite" },
              { value: "custom", label: "Custom" },
            ]}
          />

          <SettingsFormField
            name="privacy.accessLogsEnabled"
            label="Access Logs"
            description="Enable logging of access and activity"
            type="switch"
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Navigate to access logs viewer
                window.open("/admin/logs", "_blank")
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Access Logs
            </Button>
          </div>
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <h4 className="text-md font-medium">Role-Based Permissions</h4>
          <SettingsFormField
            name="privacy.adminRole"
            label="Admin Role"
            description="You have administrator privileges"
            type="switch"
            disabled
          />
          <SettingsFormField
            name="privacy.operatorRole"
            label="Operator Role"
            description="You have operator privileges"
            type="switch"
            disabled
          />
          <p className="text-xs text-white/60">
            Contact your administrator to change roles
          </p>
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <h4 className="text-md font-medium">Compliance</h4>
          <SettingsFormField
            name="privacy.compliance.gdpr"
            label="GDPR Compliance"
            description="Enable GDPR compliance features"
            type="switch"
          />
          <SettingsFormField
            name="privacy.compliance.ccpa"
            label="CCPA Compliance"
            description="Enable CCPA compliance features"
            type="switch"
          />
          <SettingsFormField
            name="privacy.compliance.hipaa"
            label="HIPAA Compliance"
            description="Enable HIPAA compliance features"
            type="switch"
          />
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <SettingsFormField
            name="privacy.aiUsageTransparencyLog"
            label="AI Usage Transparency Log"
            description="Log all AI usage for transparency"
            type="switch"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Navigate to AI usage log
                window.open("/admin/ai-usage", "_blank")
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View AI Usage Log
            </Button>
          </div>
        </div>

        <div className="p-4 glass border border-red-500/20 rounded-lg space-y-4">
          <h4 className="text-md font-medium text-red-400">Data Management</h4>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportData}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteData}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Data
            </Button>
          </div>
          <p className="text-xs text-white/60">
            Export or permanently delete all your data. These actions cannot be undone.
          </p>
        </div>
      </div>
    </SettingsSectionWrapper>
  )
}
