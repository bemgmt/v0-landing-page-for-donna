"use client"

import { useEffect, useState } from "react"

type SessionRow = {
  id: string
  status: string
  member?: { display_name?: string | null; email?: string | null } | null
}

export default function LiveChatPanel() {
  const [waiting, setWaiting] = useState<SessionRow[]>([])
  const [live, setLive] = useState<SessionRow[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ id: string; role: string; message: string; created_at: string }[]>(
    [],
  )
  const [staffMsg, setStaffMsg] = useState("")
  const [presence, setPresence] = useState<"online" | "away" | "offline">("offline")

  async function refreshQueues() {
    const res = await fetch("/api/chat/live", { credentials: "same-origin" })
    const data = (await res.json()) as { waiting?: SessionRow[]; live?: SessionRow[] }
    setWaiting(data.waiting ?? [])
    setLive(data.live ?? [])
  }

  async function loadMessages(id: string) {
    const res = await fetch(`/api/chat/messages?session_id=${encodeURIComponent(id)}`, {
      credentials: "same-origin",
    })
    const data = (await res.json()) as { messages?: typeof messages }
    setMessages(data.messages ?? [])
  }

  async function takeover(id: string) {
    await fetch("/api/chat/takeover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: id }),
      credentials: "same-origin",
    })
    setSessionId(id)
    await loadMessages(id)
    await refreshQueues()
  }

  async function sendStaff() {
    if (!sessionId || !staffMsg.trim()) return
    await fetch("/api/chat/staff-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message: staffMsg }),
      credentials: "same-origin",
    })
    setStaffMsg("")
    await loadMessages(sessionId)
  }

  async function setAvail(next: "online" | "away" | "offline") {
    await fetch("/api/chat/staff-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: next }),
      credentials: "same-origin",
    })
    setPresence(next)
  }

  useEffect(() => {
    void refreshQueues()
    const t = setInterval(() => void refreshQueues(), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    const t = setInterval(() => void loadMessages(sessionId), 6000)
    return () => clearInterval(t)
  }, [sessionId])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground">Staff presence:</span>
          {(["online", "away", "offline"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => void setAvail(p)}
              className={`text-xs px-2 py-1 rounded border ${
                presence === p ? "border-cyan-400 text-cyan-300" : "border-white/15"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Waiting</h2>
          <ul className="space-y-2">
            {waiting.map((w) => (
              <li key={w.id} className="rounded-lg border border-white/10 p-3 flex justify-between gap-2">
                <div>
                  <p className="text-xs font-mono">{w.id}</p>
                  <p className="text-sm">{w.member?.display_name ?? w.member?.email ?? "Member"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void takeover(w.id)}
                  className="text-xs px-2 py-1 rounded border border-cyan-400/50 text-cyan-300 shrink-0"
                >
                  Take over
                </button>
              </li>
            ))}
          </ul>
          {waiting.length === 0 ? <p className="text-xs text-muted-foreground">Nobody waiting.</p> : null}
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Live</h2>
          <ul className="space-y-2">
            {live.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSessionId(w.id)
                    void loadMessages(w.id)
                  }}
                  className="w-full text-left rounded-lg border border-white/10 p-3 hover:border-cyan-400/30"
                >
                  <p className="text-xs font-mono">{w.id}</p>
                  <p className="text-sm">{w.member?.display_name ?? w.member?.email ?? "Member"}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 liquid-glass p-4 flex flex-col min-h-[320px]">
        <h2 className="text-sm font-medium mb-2">Conversation</h2>
        <div className="flex-1 overflow-y-auto space-y-2 text-sm mb-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">{m.role}</p>
              <p className="whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
        <textarea
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[72px]"
          placeholder="Staff reply…"
          value={staffMsg}
          onChange={(e) => setStaffMsg(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void sendStaff()}
          disabled={!sessionId}
          className="mt-2 rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
        >
          Send as staff
        </button>
      </div>
    </div>
  )
}
