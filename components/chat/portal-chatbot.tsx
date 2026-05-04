"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, X, MessageCircle, User, Headphones } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  role: "user" | "assistant" | "staff" | "system"
  message: string
  created_at: string
}

interface ChatSession {
  id: string
  status: "ai" | "waiting_for_staff" | "live" | "closed"
  requested_human: boolean
}

export default function PortalChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStaffOnline, setIsStaffOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 1. Fetch initial session and staff status
  useEffect(() => {
    async function init() {
      const { data: sessData } = await fetch("/api/chat/session").then(res => res.json())
      if (sessData?.sessions?.[0]) {
        setSession(sessData.sessions[0])
        fetchMessages(sessData.sessions[0].id)
      }

      const { data: presenceData } = await fetch("/api/chat/presence").then(res => res.json())
      setIsStaffOnline(presenceData?.online_staff?.length > 0)
    }
    void init()
  }, [])

  const fetchMessages = async (id: string) => {
    const { messages: msgs } = await fetch(`/api/chat/message?session_id=${id}`).then(res => res.json())
    if (msgs) setMessages(msgs)
  }

  // 2. Real-time subscription
  useEffect(() => {
    if (!session?.id) return

    const channel = supabase
      .channel(`chat:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          setSession(payload.new as ChatSession)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startNewSession = async () => {
    setIsLoading(true)
    const { session: newSess } = await fetch("/api/chat/session", { method: "POST" }).then(res => res.json())
    if (newSess) {
      setSession(newSess)
      setMessages([])
    }
    setIsLoading(false)
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return
    
    let currentSessionId = session?.id
    if (!currentSessionId) {
      const { session: newSess } = await fetch("/api/chat/session", { method: "POST" }).then(res => res.json())
      if (!newSess) return
      currentSessionId = newSess.id
      setSession(newSess)
    }

    const text = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      await fetch("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({ session_id: currentSessionId, message: text }),
      })
    } catch (err) {
      console.error("Failed to send message", err)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, session])

  const requestHuman = async () => {
    if (!session) return
    setIsLoading(true)
    await fetch("/api/chat/session", {
      method: "PATCH",
      body: JSON.stringify({ id: session.id, requested_human: true, status: "waiting_for_staff" }),
    })
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-50"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] max-w-[calc(100vw-2rem)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-accent p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm">DONNA Assistant</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-wider">
                  {session?.status === "live" ? "Talking to Support" : session?.status === "waiting_for_staff" ? "Connecting..." : "AI Mode"}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">How can I help you with DONNA today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-background border border-border shadow-sm"
                }`}>
                  {msg.role === "staff" && (
                    <p className="text-[10px] font-bold text-accent mb-1 uppercase">Support Staff</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[10px] opacity-40 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-2xl px-4 py-2 animate-pulse">
                  <p className="text-sm">...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-background border-t border-border">
            {session?.status === "ai" && !session.requested_human && (
              <button 
                onClick={requestHuman}
                className="w-full mb-3 text-[11px] text-accent hover:underline font-medium flex items-center justify-center gap-1.5"
              >
                <User className="w-3 h-3" />
                Talk to a human representative
              </button>
            )}
            
            {session?.status === "waiting_for_staff" && (
              <div className="mb-3 p-2 rounded bg-accent/10 border border-accent/20 text-[11px] text-accent text-center font-medium animate-pulse">
                Human assistance requested. Please wait...
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
