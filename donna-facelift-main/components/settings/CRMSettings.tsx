"use client"

import { useFormContext } from "react-hook-form"
import { SettingsFormField } from "./SettingsFormField"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function CRMSettings() {
  const { watch, setValue } = useFormContext()
  const pipelineConfig = watch("integrations.crm.pipelineConfig")
  const dealStages = pipelineConfig?.dealStages || []
  const customFieldMappings = pipelineConfig?.customFieldMappings || []
  const automationRules = pipelineConfig?.automationRules || []

  const handleAddStage = () => {
    const newStage = {
      id: Math.random().toString(36).substring(7),
      name: "",
      order: dealStages.length,
      probability: 0,
    }
    setValue("integrations.crm.pipelineConfig.dealStages", [...dealStages, newStage])
  }

  const handleRemoveStage = (id: string) => {
    setValue(
      "integrations.crm.pipelineConfig.dealStages",
      dealStages.filter((stage: any) => stage.id !== id)
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <SettingsFormField
        name="integrations.crm.provider"
        label="CRM Provider"
        description="Select your CRM provider"
        type="select"
        options={[
          { value: "salesforce", label: "Salesforce" },
          { value: "hubspot", label: "HubSpot" },
          { value: "custom", label: "Custom" },
        ]}
      />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="pipeline" className="border-white/20">
          <AccordionTrigger className="text-white">Pipeline Configuration</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Deal Pipeline Stages</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddStage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stage
                </Button>
              </div>
              <div className="space-y-2">
                {dealStages.map((stage: any, index: number) => (
                  <div key={stage.id} className="p-3 bg-white/5 rounded flex items-center gap-3">
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => {
                        const updated = [...dealStages]
                        updated[index].name = e.target.value
                        setValue("integrations.crm.pipelineConfig.dealStages", updated)
                      }}
                      placeholder="Stage name"
                      className="flex-1 glass border border-white/20 rounded px-3 py-1 text-white text-sm"
                    />
                    <input
                      type="number"
                      value={stage.probability}
                      onChange={(e) => {
                        const updated = [...dealStages]
                        updated[index].probability = parseInt(e.target.value) || 0
                        setValue("integrations.crm.pipelineConfig.dealStages", updated)
                      }}
                      placeholder="Probability %"
                      className="w-24 glass border border-white/20 rounded px-3 py-1 text-white text-sm"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={() => handleRemoveStage(stage.id)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <SettingsFormField
              name="integrations.crm.pipelineConfig.multiTenantReporting"
              label="Multi-Tenant Reporting"
              description="Enable multi-tenant reporting features"
              type="switch"
            />

            <SettingsFormField
              name="integrations.crm.pipelineConfig.forecastingModel"
              label="Forecasting Model"
              description="Model used for sales forecasting"
              type="select"
              options={[
                { value: "linear", label: "Linear" },
                { value: "exponential", label: "Exponential" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
