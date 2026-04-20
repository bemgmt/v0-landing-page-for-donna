"use client"

import { useState } from "react"

export default function LeadAssignForm() {
  const [leadId, setLeadId] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  async function submit() {
    setMsg(null)
    const res = await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId.trim() }),
      credentials: "same-origin",
    })
    const data = (await res.json()) as { ok?: boolean; error?: string }
    if (res.ok && data.ok) {
      setMsg("Assigned.")
      setLeadId("")
      return
    }
    setMsg(data.error ?? "Failed")
  }

  return (
    <div className="rounded-xl border border-white/10 liquid-glass p-4 space-y-3 max-w-lg">
      <p className="text-sm font-medium">Round-robin assign lead</p>
      <input
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm font-mono"
        placeholder="Lead UUID"
        value={leadId}
        onChange={(e) => setLeadId(e.target.value)}
      />
      <button
        type="button"
        onClick={() => void submit()}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm"
      >
        Assign next partner
      </button>
      {msg ? <p className="text-sm text-cyan-300">{msg}</p> : null}
    </div>
  )
}
