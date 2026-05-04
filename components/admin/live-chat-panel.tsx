"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send, User, MessageCircle, Clock } from "lucide-react"

type SessionRow = {
  id: string
  status: string
  member_profiles?: { display_name?: string | null; email?: string | null } | null
}

type Message = { id: string; role: string; message: string; created_at: string }

export default function LiveChatPanel() {
  const [waiting, setWaiting] = useState<SessionRow[]>([])
  const [live, setLive] = useState<SessionRow[]>([])
  const [ai, setAi] = useState<SessionRow[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [staffMsg, setStaffMsg] = useState("")
  const [presence, setPresence] = useState<"online" | "away" | "offline">("offline")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  async function refreshQueues() {
    try {
      const res = await fetch("/api/chat/session")
      const { sessions } = await res.json()
      if (sessions) {
        setWaiting(sessions.filter((s: any) => s.status === "waiting_for_staff"))
        setLive(sessions.filter((s: any) => s.status === "live"))
        setAi(sessions.filter((s: any) => s.status === "ai"))
      }
    } catch (err) {
      console.error("Queue refresh failed", err)
    }
  }

  async function loadMessages(id: string) {
    try {
      const res = await fetch(`/api/chat/message?session_id=${id}`)
      const { messages: msgs } = await res.json()
      if (msgs) setMessages(msgs)
    } catch (err) {
      console.error("Failed to load messages", err)
    }
  }

  async function takeover(id: string) {
    await fetch("/api/chat/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "live" }),
    })
    setSessionId(id)
    void loadMessages(id)
    void refreshQueues()
  }

  async function sendStaff() {
    if (!sessionId || !staffMsg.trim()) return
    const text = staffMsg.trim()
    setStaffMsg("")
    await fetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message: text }),
    })
  }

  async function setAvail(next: "online" | "away" | "offline") {
    await fetch("/api/chat/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: next }),
    })
    setPresence(next)
  }

  // 1. Queue management subscription
  useEffect(() => {
    void refreshQueues()
    const channel = supabase
      .channel("chat_queues")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        () => {
          void refreshQueues()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  // 2. Message subscription for active session
  useEffect(() => {
    if (!sessionId) return
    
    void loadMessages(sessionId)
    const channel = supabase
      .channel(`admin_chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-12rem)]">
      {/* Sidebar: Queues */}
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2">
        <div className="flex gap-2 flex-wrap items-center bg-muted/50 p-3 rounded-lg border border-border">
          <span className="text-[10px] font-bold uppercase text-muted-foreground mr-2">Status:</span>
          {(["online", "away", "offline"] as const).map((p) => (
            <button
              key={p}
              onClick={() => void setAvail(p)}
              className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-all ${
                presence === p 
                  ? "bg-accent text-accent-foreground shadow-sm" 
                  : "bg-background border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Waiting Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Waiting ({waiting.length})
          </h3>
          <div className="space-y-2">
            {waiting.map((w) => (
              <div key={w.id} className="group rounded-xl border border-accent/20 bg-accent/5 p-4 flex justify-between items-center transition-all hover:bg-accent/10">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{w.member_profiles?.display_name ?? w.member_profiles?.email ?? "User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{w.id}</p>
                </div>
                <button
                  onClick={() => void takeover(w.id)}
                  className="text-[10px] font-bold uppercase bg-accent text-accent-foreground px-3 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-transform"
                >
                  Join
                </button>
              </div>
            ))}
            {waiting.length === 0 && <p className="text-xs text-muted-foreground italic">No users waiting.</p>}
          </div>
        </div>

        {/* Live Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" />
            Live ({live.length})
          </h3>
          <div className="space-y-2">
            {live.map((w) => (
              <button
                key={w.id}
                onClick={() => setSessionId(w.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  sessionId === w.id 
                    ? "border-accent bg-accent/10 shadow-sm" 
                    : "border-border hover:bg-muted bg-background"
                }`}
              >
                <p className="text-sm font-bold truncate">{w.member_profiles?.display_name ?? w.member_profiles?.email ?? "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{w.id}</p>
              </button>
            ))}
          </div>
        </div>

        {/* AI Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            AI Bot ({ai.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {ai.map((w) => (
              <button
                key={w.id}
                onClick={() => setSessionId(w.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  sessionId === w.id 
                    ? "border-accent bg-accent/10" 
                    : "border-border hover:bg-muted bg-background"
                }`}
              >
                <p className="text-sm font-bold truncate">{w.member_profiles?.display_name ?? w.member_profiles?.email ?? "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{w.id}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-8 flex flex-col bg-background border border-border rounded-2xl overflow-hidden shadow-xl">
        {sessionId ? (
          <>
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold">Active Conversation</h2>
                <p className="text-[10px] text-muted-foreground font-mono">{sessionId}</p>
              </div>
              <button 
                onClick={() => void takeover(sessionId)}
                className="text-[10px] font-bold uppercase bg-background border border-border px-3 py-1.5 rounded hover:bg-muted"
              >
                Reconnect / Takeover
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "staff" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "staff" 
                      ? "bg-accent text-accent-foreground" 
                      : m.role === "user"
                      ? "bg-background border border-border shadow-sm"
                      : "bg-muted/50 border border-dashed border-border italic text-muted-foreground"
                  }`}>
                    <p className="text-[9px] font-bold uppercase mb-1 opacity-60">{m.role}</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    <p className="text-[9px] opacity-40 mt-1.5 text-right">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-background border-t border-border">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm min-h-[44px] max-h-[120px] focus:ring-1 focus:ring-accent outline-none transition-all"
                  placeholder="Type a response to the member..."
                  value={staffMsg}
                  onChange={(e) => setStaffMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void sendStaff()
                    }
                  }}
                />
                <button
                  onClick={() => void sendStaff()}
                  disabled={!staffMsg.trim()}
                  className="w-11 h-11 shrink-0 rounded-xl bg-accent flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 opacity-20" />
            </div>
            <h3 className="text-sm font-bold">No Active Conversation</h3>
            <p className="text-xs max-w-[240px] mt-2">Select a session from the queue to start monitoring or helping members.</p>
          </div>
        )}
      </div>
    </div>
  )
}
