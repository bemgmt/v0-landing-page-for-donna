"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Inbox, Star, Archive, Trash2, Mail, RefreshCw } from "lucide-react"

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
}

export default function EmailInterface() {
  const [selectedEmail, setSelectedEmail] = useState(0)
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    inbox: 0,
    starred: 0,
    sent: 0
  })

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      // Prefer a dedicated marketing API if provided; fallback to general API base, then Render
      const marketingApiBase = process.env.NEXT_PUBLIC_MARKETING_API || process.env.NEXT_PUBLIC_API_BASE || 'https://donna-interactive-1.onrender.com'

      const response = await fetch(`${marketingApiBase}/api/marketing.php?action=inbox&limit=5`)
      const data = await response.json()

      if (data.success && data.data.emails) {
        const emailList = data.data.emails.map((email: any, index: number) => ({
          id: email.id || `email-${index}`,
          from: email.from || email.from_email || 'Unknown',
          from_email: email.from_email || email.from || 'unknown@example.com',
          subject: email.subject || 'No Subject',
          preview: email.preview || email.snippet || 'No preview available',
          time: formatDate(email.date),
          starred: email.starred || false,
          unread: email.unread || false,
          category: email.category || 'general',
          priority: email.priority || 'normal'
        }))

        setEmails(emailList)
        setStats({
          inbox: data.data.count || emailList.length,
          starred: emailList.filter((e: any) => e.starred).length,
          sent: 0
        })
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch emails')
      }
    } catch (err: any) {
      console.error('Email fetch error:', err)
      setError(err.message)
      // Fallback to mock data
      setEmails([
        {
          id: "mock1",
          from: "Sarah Johnson",
          from_email: "sarah@example.com",
          subject: "Q4 Marketing Campaign Results",
          preview: "The campaign exceeded our expectations with a 23% increase...",
          time: "2h ago",
          starred: true,
          unread: true
        },
        {
          id: "mock2",
          from: "Mike Chen",
          from_email: "mike@example.com",
          subject: "Project Timeline Update",
          preview: "I wanted to update you on the current status of our development...",
          time: "4h ago",
          starred: false,
          unread: false
        },
        {
          id: "mock3",
          from: "AI Assistant",
          from_email: "ai@donna.com",
          subject: "Weekly Analytics Report",
          preview: "Your email performance metrics for this week show...",
          time: "1d ago",
          starred: true,
          unread: true
        }
      ])
      setStats({ inbox: 3, starred: 2, sent: 0 })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen flex pt-20">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light">Email</h2>
          <button
            onClick={fetchEmails}
            className="p-1 hover:bg-white/10 rounded"
            title="Refresh emails"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
            {error}
          </div>
        )}

        <nav className="space-y-2">
          {[
            { icon: Inbox, label: "Inbox", count: stats.inbox },
            { icon: Star, label: "Starred", count: stats.starred },
            { icon: Send, label: "Sent", count: stats.sent },
            { icon: Archive, label: "Archive" },
            { icon: Trash2, label: "Trash" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
              <item.icon className="w-4 h-4 text-white/60" />
              <span className="text-sm">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">{item.count}</span>
              )}
            </div>
          ))}
        </nav>

        {loading && (
          <div className="mt-4 text-center text-xs text-white/60">
            Loading emails...
          </div>
        )}
      </div>

      {/* Email List */}
      <div className="w-80 border-r border-white/20">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-medium">Inbox</h3>
        </div>
        <div className="overflow-y-auto">
          {emails.length === 0 && !loading ? (
            <div className="p-4 text-center text-white/60">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No emails found</p>
            </div>
          ) : (
            emails.map((email, index) => (
              <div
                key={email.id}
                className={`p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 ${
                  selectedEmail === index ? "bg-white/10" : ""
                } ${email.unread ? "bg-blue-500/5" : ""}`}
                onClick={() => setSelectedEmail(index)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${email.unread ? "text-white" : "text-white/80"}`}>
                      {email.from}
                    </span>
                    {email.unread && <div className="w-2 h-2 bg-blue-400 rounded-full"></div>}
                    {email.starred && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                  </div>
                  <span className="text-xs text-white/60">{email.time}</span>
                </div>
                <div className={`text-sm mb-1 ${email.unread ? "text-white font-medium" : "text-white/80"}`}>
                  {email.subject}
                </div>
                <div className="text-xs text-white/60 line-clamp-2">{email.preview}</div>
                {email.category && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      email.category === 'lead' ? 'bg-green-500/20 text-green-400' :
                      email.category === 'client' ? 'bg-blue-500/20 text-blue-400' :
                      email.category === 'marketing' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {email.category}
                    </span>
                    {email.priority === 'high' && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                        High Priority
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col">
        {emails.length > 0 && emails[selectedEmail] ? (
          <>
            <div className="p-6 border-b border-white/20">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium">{emails[selectedEmail].subject}</h2>
                  <p className="text-sm text-white/60 mt-1">
                    From: {emails[selectedEmail].from} &lt;{emails[selectedEmail].from_email}&gt;
                  </p>
                  <p className="text-xs text-white/40 mt-1">{emails[selectedEmail].time}</p>
                </div>
                <div className="flex gap-2">
                  {emails[selectedEmail].starred && (
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  )}
                  {emails[selectedEmail].unread && (
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="prose prose-invert max-w-none">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                  <p className="text-sm text-white/80">
                    <strong>Preview:</strong> {emails[selectedEmail].preview}
                  </p>
                  {emails[selectedEmail].category && (
                    <p className="text-xs text-white/60 mt-2">
                      <strong>Category:</strong> {emails[selectedEmail].category}
                      {emails[selectedEmail].priority && (
                        <span className="ml-2">
                          <strong>Priority:</strong> {emails[selectedEmail].priority}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="text-white/70">
                  <p>🧠 <strong>DONNA Gmail Integration</strong></p>
                  <p className="mt-2">
                    This email was fetched from <strong>donna@bemdonna.com</strong> using the Gmail API.
                  </p>
                  <p className="mt-4 text-sm text-white/60">
                    Full email content reading and reply functionality coming soon...
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/20">
              <button className="bg-white text-black px-4 py-2 rounded hover:bg-white/90 transition-colors">
                Reply
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an email to view its content</p>
              {loading && <p className="text-sm mt-2">Loading emails...</p>}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
