"use client"

import { useState } from "react"

type Props = {
  initial: {
    display_name: string | null
    company_name: string | null
    bio: string | null
    phone: string | null
    website_url: string | null
  }
}

export default function ProfileForm({ initial }: Props) {
  const [values, setValues] = useState(initial)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function save() {
    setStatus("saving")
    const res = await fetch("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      credentials: "same-origin",
    })
    if (!res.ok) {
      setStatus("error")
      return
    }
    setStatus("saved")
    setTimeout(() => setStatus("idle"), 2000)
  }

  return (
    <div className="space-y-4 max-w-xl">
      {(["display_name", "company_name", "phone", "website_url"] as const).map((field) => (
        <label key={field} className="block text-sm">
          <span className="text-muted-foreground capitalize">{field.replace("_", " ")}</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            value={values[field] ?? ""}
            onChange={(e) => setValues({ ...values, [field]: e.target.value || null })}
          />
        </label>
      ))}
      <label className="block text-sm">
        <span className="text-muted-foreground">Bio</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[120px]"
          value={values.bio ?? ""}
          onChange={(e) => setValues({ ...values, bio: e.target.value || null })}
        />
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={status === "saving"}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save profile"}
      </button>
      {status === "saved" ? <p className="text-sm text-cyan-300">Saved.</p> : null}
      {status === "error" ? <p className="text-sm text-red-400">Could not save.</p> : null}
    </div>
  )
}
