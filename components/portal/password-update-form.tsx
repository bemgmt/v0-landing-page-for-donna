"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function PasswordUpdateForm() {
  const supabase = createClient()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [feedback, setFeedback] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    
    if (password !== confirmPassword) {
      setStatus("error")
      setFeedback("Passwords do not match.")
      return
    }
    
    if (password.length < 6) {
      setStatus("error")
      setFeedback("Password must be at least 6 characters.")
      return
    }

    setStatus("saving")
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setStatus("error")
      setFeedback(error.message)
      return
    }

    setStatus("saved")
    setFeedback("Password updated successfully.")
    setPassword("")
    setConfirmPassword("")
    
    setTimeout(() => {
      setStatus("idle")
      setFeedback(null)
      if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
        window.location.assign('/portal')
      }
    }, 2000)
  }

  return (
    <div className="space-y-4 max-w-xl">
      <form onSubmit={save} className="flex flex-col gap-4">
        <label className="block text-sm">
          <span className="text-muted-foreground">New Password</span>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-foreground outline-none ring-cyan-400/40 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        
        <label className="block text-sm">
          <span className="text-muted-foreground">Confirm New Password</span>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-foreground outline-none ring-cyan-400/40 focus:ring-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={status === "saving" || !password || !confirmPassword}
          className="rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-60 self-start"
        >
          {status === "saving" ? "Updating…" : "Update Password"}
        </button>
      </form>

      {status === "saved" ? <p className="text-sm text-cyan-300">{feedback}</p> : null}
      {status === "error" ? <p className="text-sm text-red-400">{feedback}</p> : null}
    </div>
  )
}
