"use client"

import { Loader2 } from "lucide-react"
import type { BusinessCardExtraction } from "@/lib/card-scanner/card-scan-schema"

type CardPreviewFormProps = {
  value: BusinessCardExtraction
  onChange: (next: BusinessCardExtraction) => void
  eventTag: string
  onEventTagChange: (v: string) => void
  onSave: () => void
  saving: boolean
}

function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
      />
    </div>
  )
}

export function CardPreviewForm({
  value,
  onChange,
  eventTag,
  onEventTagChange,
  onSave,
  saving,
}: CardPreviewFormProps) {
  const patch = (partial: Partial<BusinessCardExtraction>) =>
    onChange({ ...value, ...partial })

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-4">
        <FormField
          id="full_name"
          label="Name"
          value={value.full_name}
          onChange={(v) => patch({ full_name: v })}
          autoComplete="name"
        />
        <FormField
          id="company"
          label="Company"
          value={value.company}
          onChange={(v) => patch({ company: v })}
        />
        <FormField
          id="job_title"
          label="Job Title"
          value={value.job_title}
          onChange={(v) => patch({ job_title: v })}
        />
        <FormField
          id="phone"
          label="Phone"
          type="tel"
          value={value.phone}
          onChange={(v) => patch({ phone: v })}
          autoComplete="tel"
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          value={value.email}
          onChange={(v) => patch({ email: v })}
          autoComplete="email"
        />
        <FormField
          id="website"
          label="Website"
          value={value.website}
          onChange={(v) => patch({ website: v })}
        />
        <FormField
          id="event_tag"
          label="Event Tag (optional)"
          value={eventTag}
          onChange={onEventTagChange}
          placeholder="e.g. DONNA Launch Event June 2026"
        />
      </div>

      <button
        type="button"
        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold text-sm tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        disabled={saving}
        onClick={onSave}
      >
        {saving ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Saving…
          </>
        ) : (
          "Save Lead"
        )}
      </button>
    </div>
  )
}
