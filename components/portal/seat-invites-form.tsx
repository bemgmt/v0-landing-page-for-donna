"use client"

import { useCallback, useEffect, useState } from "react"

type GetResponse =
  | {
      mode: "team_member"
      invites: []
      seatsAllowance: number
      planKey: string
      planLabel: string
    }
  | {
      mode: "none"
      invites: []
      seatsAllowance: number
      planKey: string
      planLabel: string
    }
  | {
      mode: "purchaser"
      invites: { email: string; created_at: string | null }[]
      seatsAllowance: number
      planKey: string
      planLabel: string
    }

export default function SeatInvitesForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<GetResponse | null>(null)
  const [draft, setDraft] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/seats", { credentials: "same-origin" })
      const j = (await res.json().catch(() => ({}))) as GetResponse & { error?: string }
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not load seats.")
        setData(null)
        return
      }
      setData(j as GetResponse)
      if (j.mode === "purchaser" && Array.isArray(j.invites)) {
        setDraft(j.invites.map((i) => i.email).join("\n"))
      }
    } catch {
      setError("Network error.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/seats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ emails: draft }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Save failed.")
        return
      }
      await load()
    } catch {
      setError("Network error.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!data) {
    return <p className="text-sm text-destructive">{error ?? "Something went wrong."}</p>
  }

  if (data.mode === "team_member") {
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
        <p className="text-foreground/90 font-medium">Partner access via team invitation</p>
        <p>
          Your seat is on: <span className="text-foreground">{data.planLabel}</span>
          {data.seatsAllowance > 0 ? (
            <span className="text-muted-foreground"> ({data.seatsAllowance} seats on this subscription)</span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground/90">
          Ask the subscription owner to add or change your email if you cannot sign in. Lookup key:{" "}
          <span className="font-mono text-foreground/80">{data.planKey || "—"}</span>
        </p>
      </div>
    )
  }

  if (data.mode === "none") {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
        When your subscription is active, you can add team emails here (up to your plan&apos;s seat allowance).
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add up to <span className="text-foreground font-medium">{data.seatsAllowance}</span> email
        {data.seatsAllowance === 1 ? "" : "s"} (one per line). Each address gets partner portal access when they sign
        in with that email.
      </p>
      <label className="block text-sm font-medium text-foreground/90" htmlFor="seat-emails">
        Team emails
      </label>
      <textarea
        id="seat-emails"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        placeholder={"one@company.com\nother@company.com"}
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-full px-5 py-2 text-sm font-semibold bg-accent text-background hover:bg-accent/90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save seats"}
      </button>
    </div>
  )
}
