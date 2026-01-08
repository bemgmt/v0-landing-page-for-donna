"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, MessageCircle } from "lucide-react"
import Image from "next/image"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Donna, your AI Operations Assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Show prompt after a delay if chatbot hasn't been opened
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    } else {
      setShowPrompt(false)
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call the chatbot API
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), history: messages }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chatbot error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again or contact us at info@bemdonna.com.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]" style={{ position: 'fixed' }}>
          {/* Attention-grabbing notification */}
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
              setIsOpen(true)
              setShowPrompt(false)
            }}
            className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 relative animate-chatbot-pulse group"
            aria-label="Open chat"
          >
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-full bg-accent opacity-75 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-accent opacity-50 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            
            <MessageCircle className="w-6 h-6 text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[420px] h-[640px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] flex flex-col liquid-glass-card rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slide-up"
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div className="liquid-glass border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full liquid-glass-clear flex items-center justify-center border border-white/20 overflow-hidden">
                <Image
                  src="/DONNA-logo.png"
                  alt="DONNA Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-foreground">DONNA</h3>
                <p className="text-xs text-foreground/60">AI Operations Assistant</p>
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

          {/* Messages */}
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
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

          {/* Input */}
          <div className="p-4 border-t border-white/10 liquid-glass">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg liquid-glass-clear border border-white/10 focus:border-accent/50 focus:outline-none transition-colors text-foreground placeholder:text-foreground/40 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 rounded-lg liquid-glass text-foreground hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center border border-white/20"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-foreground/40 mt-2 text-center">
              Powered by Bird's Eye Management Services
            </p>
          </div>
        </div>
      )}
    </>
  )
}

