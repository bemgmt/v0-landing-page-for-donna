"use client"

import { useFormContext } from "react-hook-form"
import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Play, Pause } from "lucide-react"
import { Workflow } from "@/types/settings"

export default function AutomationsWorkflowsSection() {
  const { watch, setValue } = useFormContext()
  const workflows = watch("automations.workflows") || []

  const handleAddWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Math.random().toString(36).substring(7),
      name: "New Workflow",
      enabled: false,
      triggerRules: [],
      timeBasedActions: [],
      conditionalLogic: [],
      humanInTheLoop: true,
    }
    setValue("automations.workflows", [...workflows, newWorkflow])
  }

  const handleToggleWorkflow = (id: string) => {
    setValue(
      "automations.workflows",
      workflows.map((w: Workflow) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      )
    )
  }

  const handleRemoveWorkflow = (id: string) => {
    setValue(
      "automations.workflows",
      workflows.filter((w: Workflow) => w.id !== id)
    )
  }

  return (
    <SettingsSectionWrapper
      title="Automations & Workflows"
      description="Configure what DONNA does without being asked"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium mb-1">Active Workflows</h4>
            <p className="text-sm text-white/60">
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleAddWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            Add Workflow
          </Button>
        </div>

        <div className="space-y-3">
          {workflows.map((workflow: Workflow) => (
            <div
              key={workflow.id}
              className="p-4 glass border border-white/20 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleWorkflow(workflow.id)}
                    className={`p-2 rounded ${
                      workflow.enabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {workflow.enabled ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-xs text-white/60">
                      {workflow.enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveWorkflow(workflow.id)}
                  className="p-2 hover:bg-white/10 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SettingsFormField
                  name={`automations.workflows.${workflows.findIndex((w: Workflow) => w.id === workflow.id)}.name`}
                  label="Workflow Name"
                  type="text"
                />
                <SettingsFormField
                  name={`automations.workflows.${workflows.findIndex((w: Workflow) => w.id === workflow.id)}.humanInTheLoop`}
                  label="Human-in-the-Loop"
                  description="Require human approval"
                  type="switch"
                />
              </div>

              <div className="p-3 bg-white/5 rounded space-y-2">
                <label className="text-sm font-medium">Trigger Rules</label>
                <SettingsFormField
                  name={`automations.workflows.${workflows.findIndex((w: Workflow) => w.id === workflow.id)}.triggerRules`}
                  label="Triggers"
                  description="Conditions that trigger this workflow"
                  type="textarea"
                  placeholder="Enter trigger rules (JSON format)..."
                />
              </div>

              <div className="p-3 bg-white/5 rounded space-y-2">
                <label className="text-sm font-medium">Conditional Logic</label>
                <SettingsFormField
                  name={`automations.workflows.${workflows.findIndex((w: Workflow) => w.id === workflow.id)}.conditionalLogic`}
                  label="If/Then Logic"
                  description="Conditional logic for workflow execution"
                  type="textarea"
                  placeholder="Enter if/then logic (JSON format)..."
                />
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="p-8 text-center glass border border-white/20 rounded-lg">
              <p className="text-white/60 mb-4">No workflows configured</p>
              <Button type="button" variant="outline" onClick={handleAddWorkflow}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          )}
        </div>

        <SettingsFormField
          name="automations.verticalSpecificTemplates"
          label="Vertical-Specific Workflow Templates"
          description="Use pre-configured workflows based on your vertical"
          type="switch"
        />
      </div>
    </SettingsSectionWrapper>
  )
}
