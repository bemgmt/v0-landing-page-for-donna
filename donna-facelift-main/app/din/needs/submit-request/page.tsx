"use client"

import { motion } from "framer-motion"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { GlowCard } from "@/components/din/ui/glow-card"
import { Upload } from "lucide-react"

export default function SubmitRequestPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Submit a Request"
        subtitle="Describe your project needs for the DONNA Intelligence Network"
      />

      <GlowCard className="max-w-3xl p-6 md:p-8">
        <div className="space-y-6">
          <FormField label="Request Title" placeholder="e.g., CRM Cleanup + Workflow Setup" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label="Category"
              options={["Software Development", "CRM Setup", "Workflow Automation", "Market Research", "Real Estate Ops", "Email Operations", "Lead Qualification", "Voice Support", "Branding", "Website Support", "Contractor Coordination", "Appointment Setting"]}
            />
            <FormSelect
              label="Urgency"
              options={["Low", "Medium", "High", "Critical"]}
            />
          </div>

          <FormTextarea label="Scope Summary" placeholder="Describe the project scope, deliverables, and expected outcomes…" rows={4} />

          <FormField label="Skills Needed" placeholder="e.g., Salesforce, Zapier, Process Design" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Budget Range</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="$1,000"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/30 transition-all"
                />
                <span className="text-white/30">—</span>
                <input
                  type="text"
                  placeholder="$5,000"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/30 transition-all"
                />
              </div>
            </div>
            <FormField label="Due Date" placeholder="Select date" type="date" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Region" placeholder="e.g., United States" />
            <FormSelect
              label="Visibility"
              options={["Network-wide", "Verified nodes only", "Invite only"]}
            />
          </div>

          <FormTextarea label="Notes" placeholder="Any additional context or requirements…" rows={3} />

          <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center">
            <Upload className="w-6 h-6 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/35">Drag files here or click to upload</p>
            <p className="text-[10px] text-white/20 mt-1">PDF, DOC, XLS — up to 10MB</p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
            <button className="px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-sm text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors">
              Save Draft
            </button>
            <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/30 to-cyan-500/30 border border-violet-500/20 text-sm text-white hover:from-violet-500/40 hover:to-cyan-500/40 transition-colors">
              Submit Request
            </button>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  )
}

function FormField({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/30 transition-all"
      />
    </div>
  )
}

function FormTextarea({ label, placeholder, rows = 3 }: { label: string; placeholder: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">{label}</label>
      <textarea
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/30 transition-all resize-none"
      />
    </div>
  )
}

function FormSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">{label}</label>
      <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 focus:outline-none focus:border-cyan-500/30 transition-all appearance-none">
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
