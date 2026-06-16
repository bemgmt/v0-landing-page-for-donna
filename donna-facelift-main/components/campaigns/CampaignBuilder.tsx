"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { X, Plus, Calendar, Mail, Users, Settings, Play, Eye } from "lucide-react"

export interface Campaign {
  id?: string
  name: string
  eventName: string
  contactLabel: string
  meetingType: string
  preferredSlots: string[]
  emailTemplates: EmailTemplate[]
  status: 'draft' | 'active' | 'paused' | 'completed'
}

export interface EmailTemplate {
  step: number
  delay: number
  subject: string
  body: string
  trigger: 'immediate' | 'no_reply'
}

interface CampaignBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSave: (campaign: Campaign) => void
  editingCampaign?: Campaign | null
}

const defaultEmailTemplates: EmailTemplate[] = [
  {
    step: 1,
    delay: 0,
    subject: "Great meeting you at {{event_name}}",
    body: `Hey {{first_name}},

It was great meeting you at the {{event_name}}! I really enjoyed our conversation about {{conversation_topic}}.

I'd love to continue our discussion over a quick intro meeting. You can pick a time that works for you here: {{calendar_link}}

Looking forward to connecting!

Best regards,
{{your_name}}`,
    trigger: 'immediate'
  },
  {
    step: 2,
    delay: 2,
    subject: "Just checking in 🙂",
    body: `Hey {{first_name}},

Just wanted to check in and see if you'd like to connect. I've still got a few openings this week and next.

Here's my calendar if you're interested: {{calendar_link}}

No pressure at all!

Best,
{{your_name}}`,
    trigger: 'no_reply'
  },
  {
    step: 3,
    delay: 5,
    subject: "No worries if now's not the time",
    body: `Hey {{first_name}},

Totally understand if things are hectic right now. I'll leave the door open to connect down the road.

Here's my calendar just in case: {{calendar_link}}

Wishing you all the best!

{{your_name}}`,
    trigger: 'no_reply'
  }
]

const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingCampaign 
}) => {
  const [campaign, setCampaign] = useState<Campaign>(
    editingCampaign || {
      name: "Networking Follow-Up Campaign",
      eventName: "",
      contactLabel: "Networking Contact",
      meetingType: "Intro Meeting (15 min)",
      preferredSlots: ["M/W/F 1-4 PM", "T/Th 10-12 AM"],
      emailTemplates: defaultEmailTemplates,
      status: 'draft'
    }
  )

  const [activeStep, setActiveStep] = useState(1)
  // const [showPreview, setShowPreview] = useState(false)

  const handleSave = () => {
    onSave(campaign)
    onClose()
  }

  const updateEmailTemplate = <K extends keyof EmailTemplate>(
    step: number,
    field: K,
    value: EmailTemplate[K]
  ) => {
    setCampaign(prev => ({
      ...prev,
      emailTemplates: prev.emailTemplates.map(template =>
        template.step === step ? { ...template, [field]: value } : template
      )
    }))
  }

  const addTimeSlot = () => {
    setCampaign(prev => ({
      ...prev,
      preferredSlots: [...prev.preferredSlots, ""]
    }))
  }

  const updateTimeSlot = (index: number, value: string) => {
    setCampaign(prev => ({
      ...prev,
      preferredSlots: prev.preferredSlots.map((slot, i) => i === index ? value : slot)
    }))
  }

  const removeTimeSlot = (index: number) => {
    setCampaign(prev => ({
      ...prev,
      preferredSlots: prev.preferredSlots.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 glass-dark backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Campaign Builder</h2>
              <p className="text-sm text-white/60">Create automated networking follow-up sequences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/20 p-4">
            <div className="space-y-2">
              {[
                { step: 1, icon: Settings, label: "Campaign Setup" },
                { step: 2, icon: Users, label: "Target Contacts" },
                { step: 3, icon: Calendar, label: "Scheduling" },
                { step: 4, icon: Mail, label: "Email Sequence" },
                { step: 5, icon: Eye, label: "Preview & Launch" }
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setActiveStep(item.step)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeStep === item.step
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Campaign Setup</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={campaign.name}
                        onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                        placeholder="e.g., West SGV Business Mixer Follow-up"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Event Name
                      </label>
                      <input
                        type="text"
                        value={campaign.eventName}
                        onChange={(e) => setCampaign(prev => ({ ...prev, eventName: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                        placeholder="e.g., West SGV Business Mixer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Target Contacts</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Contact Label/Tag
                      </label>
                      <select
                        value={campaign.contactLabel}
                        onChange={(e) => setCampaign(prev => ({ ...prev, contactLabel: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="Networking Contact">Networking Contact</option>
                        <option value="Chamber Member">Chamber Member</option>
                        <option value="Event Attendee">Event Attendee</option>
                        <option value="Referral">Referral</option>
                        <option value="Cold Lead">Cold Lead</option>
                      </select>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-sm text-blue-300">
                        💡 <strong>Tip:</strong> This campaign will target all contacts with the selected label. 
                        Make sure to tag your networking contacts appropriately before launching.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Meeting Scheduling</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Meeting Type
                      </label>
                      <select
                        value={campaign.meetingType}
                        onChange={(e) => setCampaign(prev => ({ ...prev, meetingType: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="Intro Meeting (15 min)">Intro Meeting (15 min)</option>
                        <option value="Coffee Chat (30 min)">Coffee Chat (30 min)</option>
                        <option value="Business Discussion (45 min)">Business Discussion (45 min)</option>
                        <option value="Strategy Session (60 min)">Strategy Session (60 min)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Preferred Time Slots
                      </label>
                      <div className="space-y-2">
                        {campaign.preferredSlots.map((slot, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={slot}
                              onChange={(e) => updateTimeSlot(index, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                              placeholder="e.g., M/W/F 1-4 PM"
                            />
                            {campaign.preferredSlots.length > 1 && (
                              <button
                                onClick={() => removeTimeSlot(index)}
                                className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addTimeSlot}
                          className="flex items-center gap-2 px-3 py-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Time Slot
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Email Sequence</h3>
                  <div className="space-y-6">
                    {campaign.emailTemplates.map((template) => (
                      <div key={template.step} className="glass border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-white">
                            Email {template.step}: {template.step === 1 ? 'Initial Follow-up' :
                                                   template.step === 2 ? 'Gentle Reminder' : 'Final Touch'}
                          </h4>
                          <span className="text-xs text-white/60">
                            {template.delay === 0 ? 'Immediate' : `+${template.delay} days`}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">Subject</label>
                            <input
                              type="text"
                              value={template.subject}
                              onChange={(e) => updateEmailTemplate(template.step, 'subject', e.target.value)}
                              className="w-full px-3 py-2 glass border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">Email Body</label>
                            <textarea
                              value={template.body}
                              onChange={(e) => updateEmailTemplate(template.step, 'body', e.target.value)}
                              rows={6}
                              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-sm text-blue-300">
                        💡 <strong>Variables available:</strong> {"{first_name}, {event_name}, {calendar_link}, {your_name}, {conversation_topic}"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Preview & Launch</h3>
                  <div className="space-y-4">
                    <div className="glass border border-white/10 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Campaign Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Campaign Name:</span>
                          <p className="text-white font-medium">{campaign.name}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Event:</span>
                          <p className="text-white font-medium">{campaign.eventName}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Target Contacts:</span>
                          <p className="text-white font-medium">{campaign.contactLabel}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Meeting Type:</span>
                          <p className="text-white font-medium">{campaign.meetingType}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass border border-white/10 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Email Sequence</h4>
                      <div className="space-y-2">
                        {campaign.emailTemplates.map((template) => (
                          <div key={template.step} className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs">
                              {template.step}
                            </div>
                            <span className="text-white/80">{template.subject}</span>
                            <span className="text-white/40 ml-auto">
                              {template.delay === 0 ? 'Immediate' : `+${template.delay} days`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-sm text-green-300">
                        ✅ <strong>Ready to launch!</strong> This campaign will automatically send personalized follow-up emails to all contacts with the &quot;{campaign.contactLabel}&quot; label.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Step {activeStep} of 5</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {activeStep < 5 ? (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Launch Campaign
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CampaignBuilder
