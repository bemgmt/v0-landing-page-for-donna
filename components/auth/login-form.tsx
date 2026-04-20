"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  nextPath: string
}

export default function LoginForm({ nextPath }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? ""

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage(null)
    const redirectTo = `${origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(nextPath)}`

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      setStatus("error")
      setMessage(error.message)
      return
    }
    setStatus("sent")
    setMessage("Check your email for the sign-in link.")
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-muted-foreground">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-foreground outline-none ring-cyan-400/40 focus:ring-2"
          placeholder="you@company.com"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Email me a sign-in link"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-400" : "text-cyan-300/90"}`}>{message}</p>
      ) : null}
    </form>
  )
}
