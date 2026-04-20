"use client"

import { useState } from "react"

type Verdict = "yes" | "partial" | "no" | "needs-human"

type Answer = {
  verdict: Verdict
  summary: string
  why: string
  recommended_next_step: string
  offer_handoff: boolean
}

export default function CanDonnaPanel() {
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setLoading(true)
    setError(null)
    setAnswer(null)
    const res = await fetch("/api/can-donna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
      credentials: "same-origin",
    })
    const data = (await res.json()) as Answer & { error?: string }
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Request failed")
      return
    }
    setAnswer(data)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <label className="block text-sm">
        <span className="text-muted-foreground">Your question</span>
        <textarea
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[120px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask whether DONNA fits a workflow, integration, or ops scenario…"
        />
      </label>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={loading || q.trim().length < 3}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Get verdict"}
      </button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {answer ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Verdict</p>
          <p className="text-lg font-medium text-cyan-300">{answer.verdict}</p>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Summary</p>
            <p>{answer.summary}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Why</p>
            <p>{answer.why}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Next step</p>
            <p>{answer.recommended_next_step}</p>
          </div>
          {answer.offer_handoff ? (
            <p className="text-amber-200/90">Human follow-up recommended.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
