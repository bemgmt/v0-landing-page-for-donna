"use client"

import { useState } from "react"

export default function LeadClaimForm() {
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle")

  async function submit() {
    setStatus("idle")
    const res = await fetch("/api/leads/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evidence_notes: notes }),
      credentials: "same-origin",
    })
    if (res.ok) {
      setStatus("ok")
      setNotes("")
      return
    }
    setStatus("err")
  }

  return (
    <div className="rounded-xl border border-white/10 liquid-glass p-4 space-y-3 max-w-xl">
      <p className="text-sm text-muted-foreground">
        Submit a manual sale claim for admin review. Include enough detail to verify the deal.
      </p>
      <textarea
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[120px]"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Order reference, buyer contact, amount, dates…"
      />
      <button
        type="button"
        disabled={notes.trim().length < 3}
        onClick={() => void submit()}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
      >
        Submit claim
      </button>
      {status === "ok" ? <p className="text-sm text-cyan-300">Claim submitted.</p> : null}
      {status === "err" ? <p className="text-sm text-red-400">Could not submit.</p> : null}
    </div>
  )
}
