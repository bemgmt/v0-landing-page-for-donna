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
  const [oauthLoading, setOauthLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; tone: "success" | "error" } | null>(null)

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? ""

  const baseOrigin = origin.replace(/\/$/, "")
  const authBusy = status === "loading" || oauthLoading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setFeedback(null)
    const redirectTo = `${baseOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    if (!baseOrigin) {
      setStatus("error")
      setFeedback({ text: "Set NEXT_PUBLIC_SITE_URL for email sign-in from this environment.", tone: "error" })
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      setStatus("error")
      setFeedback({ text: error.message, tone: "error" })
      return
    }
    setStatus("sent")
    setFeedback({ text: "Check your email for the sign-in link.", tone: "success" })
  }

  async function signInWithGoogle() {
    setOauthLoading(true)
    setFeedback(null)
    const redirectTo = `${baseOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    if (!baseOrigin) {
      setOauthLoading(false)
      setFeedback({ text: "Set NEXT_PUBLIC_SITE_URL for Google sign-in from this environment.", tone: "error" })
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })

    if (error) {
      setOauthLoading(false)
      setFeedback({ text: error.message, tone: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto">
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={authBusy}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-60"
      >
        {oauthLoading ? "Redirecting…" : "Continue with Google"}
      </button>
      <div className="relative text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-black/80 px-2">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-white/10" aria-hidden />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          disabled={authBusy}
          className="rounded-lg animated-edge-button px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {feedback ? (
        <p className={`text-sm ${feedback.tone === "error" ? "text-red-400" : "text-cyan-300/90"}`}>{feedback.text}</p>
      ) : null}
    </div>
  )
}
