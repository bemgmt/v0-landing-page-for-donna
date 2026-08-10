"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Mail, Loader2, Check } from "lucide-react"

type Props = {
  leadId: string
}

export function EmailLeadButton({ leadId }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSend = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/card-scanner/leads/${leadId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          typeof json.error === "string" ? json.error : "Failed to send email"
        )
        return
      }
      toast.success("Lead emailed — DONNA will add it to your workflow")
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
        Sent to derek@aidonna.co
      </div>
    )
  }

  return (
    <div className="flex">
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
            Email to Derek
          </>
        )}
      </button>
    </div>
  )
}
