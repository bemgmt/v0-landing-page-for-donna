"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, X, MessageCircle } from "lucide-react"
import Image from "next/image"
import { pushDataLayer } from "@/lib/data-layer"

const API_BASE = process.env.NEXT_PUBLIC_DONNA_API_BASE || "https://app.bemdonna.com"
const WIDGET_TOKEN = process.env.NEXT_PUBLIC_DONNA_WIDGET_TOKEN
const USER_PROFILE = process.env.NEXT_PUBLIC_DONNA_USER_PROFILE || "general"
const GREETING =
  process.env.NEXT_PUBLIC_DONNA_GREETING ||
  "Hi! I'm DONNA, your AI Operations Assistant. How can I help you today?"

const STORAGE_KEY = "donna_embed_chat_id"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

function logicUrl() {
  const base = API_BASE.replace(/\/$/, "")
  return `${base}/api/v1/donna/logic`
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: GREETING,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [pageReadyTime, setPageReadyTime] = useState<number | null>(null)

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = `embed-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(STORAGE_KEY, id)
    }
    setChatId(id)
  }, [])

  useEffect(() => {
    const checkIntroStatus = () => {
      const introOverlay = document.getElementById("introOverlay")
      if (!introOverlay || introOverlay.classList.contains("fadeOut")) {
        setPageReadyTime(Date.now())
      }
    }

    checkIntroStatus()

    const handleIntroComplete = () => {
      setPageReadyTime(Date.now())
    }

    window.addEventListener("introComplete", handleIntroComplete)

    const checkTimer = setTimeout(() => {
      checkIntroStatus()
    }, 1000)

    return () => {
      window.removeEventListener("introComplete", handleIntroComplete)
      clearTimeout(checkTimer)
    }
  }, [])

  useEffect(() => {
    if (!isOpen && pageReadyTime !== null) {
      const timeSinceReady = Date.now() - pageReadyTime
      const remainingTime = Math.max(0, 30000 - timeSinceReady)

      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, remainingTime)

      return () => clearTimeout(timer)
    } else {
      setShowPrompt(false)
    }
  }, [isOpen, pageReadyTime])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const text = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    if (!WIDGET_TOKEN || WIDGET_TOKEN === "YOUR_WIDGET_TOKEN") {
      const err: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Missing widget token. Create one in Chatbot Control → API tokens.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, err])
      setIsLoading(false)
      return
    }

    const id = chatId ?? localStorage.getItem(STORAGE_KEY)
    if (!id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(logicUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Widget-Token": WIDGET_TOKEN,
        },
        body: JSON.stringify({
          message: text,
          user_profile: USER_PROFILE,
          chat_id: id,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string
        error?: string | { message?: string }
      }

      let assistantText: string
      if (!response.ok) {
        const err = data?.error
        assistantText =
          (typeof err === "object" && err?.message) ||
          (typeof err === "string" ? err : null) ||
          `Error ${response.status}`
      } else {
        assistantText = data.reply ?? ""
      }

      pushDataLayer({ event: "chatbot_submit", chat_id: id })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Error contacting DONNA.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, chatId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[99999]" style={{ position: "fixed" }}>
          {showPrompt && (
            <div className="absolute bottom-full right-0 mb-3 animate-slide-down-bounce">
              <div className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-lg whitespace-nowrap relative">
                <div className="absolute -bottom-1 right-6 w-2 h-2 bg-accent rotate-45"></div>
                Ask me anything!
              </div>
            </div>
          )}

          <button
            onClick={() => {
              pushDataLayer({ event: "chatbot_open" })
              setIsOpen(true)
              setShowPrompt(false)
            }}
            className="w-14 h-14 rounded-full animated-edge-button flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 relative"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-[99999] w-[420px] h-[640px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] flex flex-col liquid-glass-card rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slide-up"
          style={{ zIndex: 99999 }}
        >
          <div className="liquid-glass border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full liquid-glass-clear flex items-center justify-center border border-white/20 overflow-hidden">
                <Image
                  src="/brand/full/donna-logo-512.png"
                  alt="DONNA Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-foreground">DONNA</h3>
                <p className="text-xs text-foreground/60">Operational intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-foreground/60 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "liquid-glass bg-white/15 text-foreground"
                      : "liquid-glass-clear text-foreground border border-white/10"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-50 mt-1.5">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="liquid-glass-clear border border-white/10 rounded-xl px-4 py-2.5 glow-accent">
                  <p className="text-sm text-foreground animate-pulse">...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 liquid-glass">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg liquid-glass-clear border border-white/10 focus:border-accent/50 focus:outline-none transition-colors text-foreground placeholder:text-foreground/40 disabled:opacity-50"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 rounded-lg liquid-glass text-foreground hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center border border-white/20"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-foreground/40 mt-2 text-center">
              Powered by Bird&apos;s Eye Management Services
            </p>
          </div>
        </div>
      )}
    </>
  )
}
