"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Mail, Loader2, Check } from "lucide-react"

type Props = {
  leadId: string
  defaultEmail?: string
}

export function EmailLeadButton({
  leadId,
  defaultEmail = "derek@aidonna.co",
}: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSend = async () => {
    if (!email.trim()) {
      toast.error("Please enter a recipient email")
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/card-scanner/leads/${leadId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_email: email.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          typeof json.error === "string" ? json.error : "Failed to send email"
        )
        return
      }
      toast.success("Lead emailed — DONNA will add to your CRM")
      setSent(true)
    } catch {
      toast.error("Network error")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <Check className="size-4" />
        Sent to {email}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="derek@aidonna.co"
        disabled={sending}
        className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        className="px-4 py-2 text-sm rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 font-medium hover:bg-violet-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {sending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Mail className="size-4" />
            Email to CRM
          </>
        )}
      </button>
    </div>
  )
}
