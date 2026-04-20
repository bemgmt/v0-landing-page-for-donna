"use client"

import { useEffect, useState } from "react"

export default function MemberChatPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ id: string; role: string; message: string }[]>([])
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<string>("")

  async function bootSession() {
    const existing = await fetch("/api/chat/session", { credentials: "same-origin" })
    const d = (await existing.json()) as { session?: { id: string; status?: string } }
    if (d.session?.id) {
      setSessionId(d.session.id)
      setMode(d.session.status ?? "")
      return
    }
    const created = await fetch("/api/chat/session", { method: "POST", credentials: "same-origin" })
    const d2 = (await created.json()) as { session?: { id: string; status?: string } }
    if (d2.session?.id) {
      setSessionId(d2.session.id)
      setMode(d2.session.status ?? "")
    }
  }

  async function refreshMessages() {
    if (!sessionId) return
    const r = await fetch(`/api/chat/messages?session_id=${encodeURIComponent(sessionId)}`, {
      credentials: "same-origin",
    })
    const data = (await r.json()) as { messages?: typeof messages }
    setMessages(data.messages ?? [])
  }

  async function send() {
    if (!sessionId || !input.trim()) return
    await fetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message: input }),
      credentials: "same-origin",
    })
    setInput("")
    await refreshMessages()
    const st = await fetch("/api/chat/session", { credentials: "same-origin" })
    const d = (await st.json()) as { session?: { status?: string } }
    setMode(d.session?.status ?? mode)
  }

  async function requestHuman() {
    if (!sessionId) return
    await fetch("/api/chat/request-human", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
      credentials: "same-origin",
    })
    await refreshMessages()
    const st = await fetch("/api/chat/session", { credentials: "same-origin" })
    const d = (await st.json()) as { session?: { status?: string } }
    setMode(d.session?.status ?? mode)
  }

  useEffect(() => {
    void bootSession()
  }, [])

  useEffect(() => {
    if (!sessionId) return
    void refreshMessages()
    const t = setInterval(() => void refreshMessages(), 6000)
    return () => clearInterval(t)
  }, [sessionId])

  return (
    <div className="rounded-xl border border-white/10 liquid-glass p-4 space-y-4 max-w-2xl">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Session: {sessionId ?? "…"} · Mode: {mode || "—"}
        </p>
        <button
          type="button"
          onClick={() => void requestHuman()}
          disabled={!sessionId}
          className="text-xs px-3 py-1 rounded border border-cyan-400/40 text-cyan-300 disabled:opacity-50"
        >
          Talk to a human
        </button>
      </div>
      <div className="space-y-2 max-h-[360px] overflow-y-auto text-sm">
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase text-muted-foreground">{m.role}</p>
            <p className="whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[72px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask DONNA…"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!sessionId}
          className="self-end rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
