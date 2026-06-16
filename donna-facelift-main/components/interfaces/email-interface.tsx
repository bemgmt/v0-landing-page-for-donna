"use client"

import { useState, useEffect, useMemo } from "react"
import type React from "react"
import { Send, Inbox, Star, Archive, Trash2, Mail, RefreshCw, Bot, Zap } from "lucide-react"
import type { gmail_v1 } from 'googleapis'
import DOMPurify from 'isomorphic-dompurify'

// Render sanitized HTML to prevent injection
const EmailBody = ({ htmlBody }: { htmlBody: string }) => {
  const sanitized = useMemo(
    () => DOMPurify.sanitize(htmlBody, { USE_PROFILES: { html: true } }),
    [htmlBody]
  )
  return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitized }} />
}

interface Email {
  id: string
  from: string
  from_email: string
  subject: string
  preview: string
  time: string
  starred: boolean
  unread?: boolean
  category?: string
  priority?: string
  payload?: gmail_v1.Schema$Message['payload']
}

export default function EmailInterface() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [composer, setComposer] = useState({ to: "", subject: "", body: "" })
  const [isSending, setIsSending] = useState(false)
  const [isDrafting, setIsDrafting] = useState(false)
  const [aiGoal, setAiGoal] = useState("")

  // Autopilot state
  const [isAutopilotOn, setIsAutopilotOn] = useState(false)

  const [stats, setStats] = useState({ inbox: 0, starred: 0, sent: 0 })

  useEffect(() => {
    fetchEmails()
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/get-settings")
        const data = await res.json()
        if (data.success) setIsAutopilotOn(data.autopilot_enabled)
      } catch (error) {
        console.error("Failed to fetch user settings", error)
      }
    }
    fetchSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once to load emails and settings on mount
  }, [])

  const handleAutopilotToggle = async () => {
    const newState = !isAutopilotOn
    setIsAutopilotOn(newState)
    try {
      const res = await fetch("/api/user/set-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newState })
      })
      if (!res.ok) throw new Error("Failed to update autopilot setting.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update autopilot setting.'
      setError(msg)
      setIsAutopilotOn(!newState)
    }
  }

  const startGmailConnect = () => {
    window.location.href = "/api/gmail/oauth/start"
  }

  const fetchEmails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/gmail/messages?limit=15")
      if (response.status === 401) {
        setError("Please sign in to connect Gmail")
        setEmails([])
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Failed to fetch emails")

      const emailList = (data.messages || []).map((msg: gmail_v1.Schema$Message): Email => {
        const headers = (msg.payload?.headers || []) as gmail_v1.Schema$MessagePartHeader[]
        const h = Object.fromEntries(
          headers
            .filter((x): x is { name: string; value: string } => !!x?.name && !!x?.value)
            .map(x => [x.name!.toLowerCase(), x.value!])
        ) as Record<string, string>
        const fromField = h["from"] || "Unknown"
        const fromNameMatch = fromField.match(/(.*)<.*>/)
        return {
          id: msg.id,
          from: fromNameMatch ? fromNameMatch[1].trim().replace(/\"/g, "") : fromField,
          from_email: (fromField.match(/<(.+)>/) || [])[1] || fromField,
          subject: h["subject"] || "No Subject",
          preview: msg.snippet || "No preview available",
          time: formatDate(h["date"]),
          starred: msg.labelIds?.includes("STARRED") || false,
          unread: msg.labelIds?.includes("UNREAD") || false,
          payload: msg.payload
        }
      })

      setEmails(emailList)
      setStats({
        inbox: emailList.filter((e: Email) => e.unread).length,
        starred: emailList.filter((e: Email) => e.starred).length,
        sent: 0
      })
    } catch (err: unknown) {
      console.error("Email fetch error:", err)
      const msg = err instanceof Error ? err.message : 'Failed to fetch emails'
      setError(msg)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!composer.to || !composer.subject) {
      alert("To and Subject are required")
      return
    }
    setIsSending(true)
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composer)
      })
      if (!res.ok) throw new Error(await res.text())
      alert("Sent!")
      setComposer({ to: "", subject: "", body: "" })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to send email: ${msg}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleReply = (message: Email) => {
    const quoted = (message.preview || "").replace(/\r?\n/g, "\n> ")
    setComposer({
      to: message.from_email,
      subject: `Re: ${message.subject}`,
      body: `\n\n> On ${new Date(message.time).toLocaleString()}, ${message.from} wrote:\n> ${quoted}`
    })
    setIsModalOpen(false)
    window.scrollTo(0, 0)
  }

  const draftWithAi = async () => {
    if (!selectedEmail) return
    if (!aiGoal) {
      alert("Please provide a goal for the AI.")
      return
    }
    setIsDrafting(true)
    try {
      const res = await fetch("/api/gmail/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: selectedEmail, goal: aiGoal })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      handleReply(selectedEmail)
      setComposer(prev => ({ ...prev, body: data.draft }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to draft reply: ${msg}`)
    } finally {
      setIsDrafting(false)
    }
  }

  const decodeBase64Url = (data: string): string => {
    try {
      const d = data.replace(/-/g, '+').replace(/_/g, '/')
      const pad = '='.repeat((4 - (d.length % 4)) % 4)
      const bin = atob(d + pad)
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    } catch {
      return ''
    }
  }

  const getEmailBody = (payload: gmail_v1.Schema$Message['payload'] | undefined): string => {
    if (!payload) return ""
    let body = ""
    const parts = payload.parts as gmail_v1.Schema$MessagePart[] | undefined
    if (parts && parts.length) {
      const part = parts.find((p) => p.mimeType === "text/plain") || parts.find((p) => p.mimeType === "text/html")
      if (part?.body?.data) body = decodeBase64Url(part.body.data)
    } else if (payload.body?.data) {
      body = decodeBase64Url(payload.body.data)
    }
    return body
  }

  const fullEmailBody = useMemo(() => (selectedEmail ? getEmailBody(selectedEmail.payload) : ""), [selectedEmail])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown"
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      if (diffHours < 1) return "Just now"
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const openEmail = (email: Email) => {
    setSelectedEmail(email)
    setIsModalOpen(true)
  }

  return (
    <div className="h-screen flex pt-20 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/20 p-4 flex flex-col">
        <div className="mb-4">
          <button onClick={startGmailConnect} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mb-2">
            Connect Gmail
          </button>
          <button onClick={fetchEmails} className="w-full py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded text-sm flex items-center justify-center gap-2" title="Refresh emails" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Inbox"}
          </button>
        </div>

        {/* Autopilot Section */}
        <div className="border-t border-b border-white/10 py-4 my-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="autopilot-toggle" className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Autopilot
            </label>
            <button onClick={handleAutopilotToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isAutopilotOn ? "bg-purple-600" : "bg-gray-600"}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAutopilotOn ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <p className="text-xs text-white/60">When enabled, Donna automatically checks for and replies to new emails every 30 minutes.</p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">{error}</div>
        )}

        <nav className="space-y-1">
          {[
            { icon: Inbox, label: "Inbox", count: stats.inbox },
            { icon: Star, label: "Starred", count: stats.starred },
            { icon: Send, label: "Sent", count: stats.sent },
            { icon: Archive, label: "Archive" },
            { icon: Trash2, label: "Trash" }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded glass hover:bg-white/10 cursor-pointer transition-colors">
              <item.icon className="w-4 h-4 text-white/60 donna-icon" />
              <span className="text-sm">{item.label}</span>
              {(item.count ?? 0) > 0 && <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">{item.count}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-white/20 flex flex-col">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-medium text-lg">Inbox</h3>
        </div>
        <div className="overflow-y-auto flex-1">
          {emails.length === 0 && !loading ? (
            <div className="p-4 text-center text-white/60 mt-10">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No emails found</p>
            </div>
          ) : (
            emails.map(email => (
              <div key={email.id} className={`p-4 border-b border-white/10 cursor-pointer glass hover:bg-white/10 transition-colors ${selectedEmail?.id === email.id ? "bg-blue-500/10" : ""} ${email.unread ? "border-l-2 border-blue-400" : ""}`} onClick={() => openEmail(email)}>
                <div className="flex items-start justify-between mb-1">
                  <span className={`font-medium text-sm ${email.unread ? "text-white" : "text-white/80"}`}>{email.from}</span>
                  <span className="text-xs text-white/60 flex-shrink-0 ml-2">{email.time}</span>
                </div>
                <div className={`text-sm mb-1 ${email.unread ? "text-white font-medium" : "text-white/80"}`}>{email.subject}</div>
                <div className="text-xs text-white/60 line-clamp-2">{email.preview}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Composer / Main View */}
      <div className="flex-1 flex flex-col glass-dark backdrop-blur">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-lg font-light">Composer</h2>
        </div>
        <div className="p-4 space-y-3">
          <input value={composer.to} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComposer(s => ({ ...s, to: e.target.value }))} placeholder="To" className="w-full glass p-2 rounded border border-white/10" />
          <input value={composer.subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComposer(s => ({ ...s, subject: e.target.value }))} placeholder="Subject" className="w-full glass p-2 rounded border border-white/10" />
          <textarea value={composer.body} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComposer(s => ({ ...s, body: e.target.value }))} placeholder="Message body..." className="w-full glass p-2 rounded h-48 border border-white/10" />
          <div className="flex justify-end">
            <button onClick={sendEmail} disabled={isSending} className="px-5 py-2 bg-white text-black rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Email View Modal */}
      {isModalOpen && selectedEmail && (
        <div className="fixed inset-0 glass-dark backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#1c1c1c] border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">{selectedEmail.subject}</h2>
              <p className="text-sm text-white/60">From: {selectedEmail.from} &lt;{selectedEmail.from_email}&gt;</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <EmailBody htmlBody={fullEmailBody} />
            </div>
            <div className="p-4 border-t border-white/10 bg-[#222] rounded-b-lg space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <input value={aiGoal} onChange={e => setAiGoal(e.target.value)} placeholder="Enter AI goal (e.g., 'schedule a meeting for next week')" className="w-full glass p-2 rounded text-sm border border-white/10" />
                <button onClick={draftWithAi} disabled={isDrafting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50 flex-shrink-0">
                  {isDrafting ? "Drafting..." : "Draft Reply with AI"}
                </button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button onClick={() => handleReply(selectedEmail)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">Reply</button>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
