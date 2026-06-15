"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Users } from "lucide-react"

type MemberRow = {
  id: string
  display_name: string | null
  company_name: string | null
  avatar_url: string | null
}

type Props = {
  leadId: string
  onSkip: () => void
  onDone: () => void
}

export function ShareLeadPanel({ leadId, onSkip, onDone }: Props) {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingMembers(true)
      try {
        const res = await fetch("/api/card-scanner/members")
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (!cancelled) {
            toast.error(
              typeof json.error === "string"
                ? json.error
                : "Could not load members"
            )
            setMembers([])
          }
          return
        }
        if (!cancelled) setMembers(json.members ?? [])
      } catch {
        if (!cancelled) toast.error("Network error loading members")
      } finally {
        if (!cancelled) setLoadingMembers(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onSubmit = async () => {
    if (selected.size === 0) {
      toast.error("Choose at least one member to share with")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/card-scanner/leads/${leadId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_profile_ids: [...selected],
          note: note.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          typeof json.error === "string"
            ? json.error
            : "Could not share lead"
        )
        return
      }
      const created =
        typeof json.created === "number" ? json.created : 0
      const dup =
        typeof json.skipped_duplicate === "number"
          ? json.skipped_duplicate
          : 0
      if (created > 0) {
        toast.success(
          created === 1
            ? "Lead shared successfully"
            : `Lead shared with ${created} members${dup > 0 ? ` (${dup} already shared)` : ""}`
        )
      } else if (dup > 0) {
        toast.message("This lead was already shared with those members")
      }
      onDone()
    } catch {
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 liquid-glass p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="size-5 text-cyan-400" />
        <h2 className="font-semibold text-foreground">Share with members</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Share this card lead with other DONNA members. Add an optional note for
        context.
      </p>

      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Note (optional)
      </label>
      <textarea
        className="w-full min-h-[80px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors mb-4"
        placeholder="e.g. Great potential partner for our AI consulting vertical"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        disabled={submitting}
      />

      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Members
      </p>
      {loadingMembers ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
          <Loader2 className="size-4 animate-spin" />
          Loading members…
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No other active members found.
        </p>
      ) : (
        <ul className="max-h-56 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/5 mb-4">
          {members.map((m) => (
            <li key={m.id}>
              <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                  disabled={submitting}
                  className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
                />
                <span className="min-w-0">
                  <span className="font-medium text-foreground block truncate">
                    {m.display_name || "Member"}
                  </span>
                  {m.company_name ? (
                    <span className="text-xs text-muted-foreground truncate block">
                      {m.company_name}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onSkip}
          disabled={submitting}
          className="px-4 py-2.5 text-sm rounded-lg border border-white/15 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || loadingMembers || members.length === 0}
          className="px-4 py-2.5 text-sm rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sharing…
            </>
          ) : (
            "Share lead"
          )}
        </button>
      </div>
    </div>
  )
}
