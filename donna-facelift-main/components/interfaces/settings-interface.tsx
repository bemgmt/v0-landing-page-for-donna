"use client"

import { useState, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { motion } from "framer-motion"
import {
  User,
  Brain,
  Database,
  MessageSquare,
  Zap,
  Shield,
  Bell,
  CreditCard,
  Settings as SettingsIcon,
} from "lucide-react"
import { DONNASettings, defaultSettings } from "@/types/settings"
import ProfileIdentitySection from "@/components/settings/ProfileIdentitySection"
import BehaviorPersonalitySection from "@/components/settings/BehaviorPersonalitySection"
import KnowledgeMemorySection from "@/components/settings/KnowledgeMemorySection"
import ToolsIntegrationsSection from "@/components/settings/ToolsIntegrationsSection"
import CommunicationChannelsSection from "@/components/settings/CommunicationChannelsSection"
import AutomationsWorkflowsSection from "@/components/settings/AutomationsWorkflowsSection"
import PrivacySecuritySection from "@/components/settings/PrivacySecuritySection"
import NotificationsSection from "@/components/settings/NotificationsSection"
import BillingPlanSection from "@/components/settings/BillingPlanSection"
import AdvancedDeveloperSection from "@/components/settings/AdvancedDeveloperSection"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

const settingsSections = [
  { id: "profile", label: "Profile & Identity", icon: User },
  { id: "behavior", label: "Behavior & Personality", icon: Brain },
  { id: "knowledge", label: "Knowledge & Memory", icon: Database },
  { id: "integrations", label: "Tools & Integrations", icon: SettingsIcon },
  { id: "channels", label: "Communication Channels", icon: MessageSquare },
  { id: "automations", label: "Automations & Workflows", icon: Zap },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
]

export default function SettingsInterface() {
  const [activeSection, setActiveSection] = useState("profile")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const toastHook = useToast()

  const form = useForm<DONNASettings>({
    defaultValues: defaultSettings,
    mode: "onChange",
  })

  const { watch, formState: { isDirty } } = form

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/chatbot_settings.php", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Merge loaded settings with defaults
            const mergedSettings = {
              ...defaultSettings,
              ...data.data,
            }
            // Convert empty string or null vertical to "none" to match our Select fix
            if (mergedSettings.profile?.vertical === "" || mergedSettings.profile?.vertical === null || mergedSettings.profile?.vertical === undefined) {
              mergedSettings.profile.vertical = "none"
            }
            form.reset(mergedSettings)
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        toastHook.toast({
          title: "Error",
          description: "Failed to load settings. Using defaults.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [form])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty])

  // Auto-save with debouncing
  useEffect(() => {
    if (!isDirty || isLoading) return

    const timeoutId = setTimeout(async () => {
      await handleSave(false) // Silent save
    }, 2000) // 2 second debounce

    return () => clearTimeout(timeoutId)
  }, [watch(), isLoading])

  const handleSave = async (showToast = true) => {
    try {
      setIsSaving(true)
      const formData = form.getValues()

      const response = await fetch("/api/chatbot_settings.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          form.reset(formData) // Mark as not dirty
          setHasUnsavedChanges(false)
          if (showToast) {
            toastHook.toast({
              title: "Success",
              description: "Settings saved successfully",
            })
          }
        } else {
          throw new Error(data.error || "Failed to save settings")
        }
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      if (showToast) {
        toastHook.toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileIdentitySection />
      case "behavior":
        return <BehaviorPersonalitySection />
      case "knowledge":
        return <KnowledgeMemorySection />
      case "integrations":
        return <ToolsIntegrationsSection />
      case "channels":
        return <CommunicationChannelsSection />
      case "automations":
        return <AutomationsWorkflowsSection />
      case "privacy":
        return <PrivacySecuritySection />
      case "notifications":
        return <NotificationsSection />
      case "billing":
        return <BillingPlanSection />
      default:
        return <ProfileIdentitySection />
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
          <p className="text-white/60">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex pt-20"
        data-tour="settings-content"
      >
        {/* Settings Sidebar */}
        <div className="w-64 border-r border-white/20 p-6 glass-dark backdrop-blur">
          <h2 className="text-xl font-light mb-6">Settings</h2>
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 donna-icon ${
                      activeSection === section.id ? "donna-icon-active" : ""
                    }`}
                  />
                  <span className="text-sm">{section.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Advanced Section - Collapsed by default */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <AdvancedDeveloperSection />
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {renderSection()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="text-sm text-yellow-400">You have unsaved changes</span>
                )}
                {isSaving && (
                  <span className="text-sm text-white/60 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleSave(true)}
                disabled={!hasUnsavedChanges || isSaving}
                className="bg-white text-black hover:bg-white/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </FormProvider>
  )
}
