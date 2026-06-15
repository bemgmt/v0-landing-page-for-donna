"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const STATUSES = ["new", "contacted", "qualified", "closed"] as const

type Props = {
  leadId: string
  currentStatus: string
}

export function LeadStatusEditor({ leadId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [updating, setUpdating] = useState(false)

  const onChange = async (newStatus: string) => {
    if (newStatus === status) return
    setUpdating(true)
    const previous = status
    setStatus(newStatus)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("business_card_leads")
        .update({ status: newStatus })
        .eq("id", leadId)
      if (error) {
        setStatus(previous)
        toast.error("Failed to update status")
      } else {
        toast.success(`Status → ${newStatus}`)
      }
    } catch {
      setStatus(previous)
      toast.error("Network error")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      disabled={updating}
      className="text-xs rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors cursor-pointer disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-[#0b1329] text-foreground">
          {s}
        </option>
      ))}
    </select>
  )
}
