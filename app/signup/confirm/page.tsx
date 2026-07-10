"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function ConfirmForm() {
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get("email") || ""
  
  const [email, setEmail] = useState(defaultEmail)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, action: "confirm" }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Confirmation failed")
      }

      setMessage(data.message)
      // Automatically route to login
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email)}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError("Email is required to resend the code.")
      return
    }
    
    setResendLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "resend" }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Resend failed")
      }

      setMessage("Code resent to your email.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
      <h1 className="text-2xl font-semibold gradient-text text-center mb-2">Confirm your account</h1>
      <p className="text-xs text-muted-foreground text-center mb-6">
        We sent a confirmation code to your email.
      </p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-6 text-center text-sm text-emerald-400">
          {message}
        </div>
      )}

      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg liquid-glass-clear border border-white/10 focus:border-cyan-400 focus:outline-none transition-colors text-foreground"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Confirmation code</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg liquid-glass-clear border border-white/10 focus:border-cyan-400 focus:outline-none transition-colors text-foreground"
            placeholder="123456"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || resendLoading}
          className="mt-4 rounded-lg animated-edge-button px-4 py-2.5 text-sm font-medium disabled:opacity-60 w-full"
        >
          {loading ? "Confirming..." : "Confirm Account"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading || resendLoading}
          className="mt-2 text-sm text-muted-foreground hover:text-cyan-300 transition-colors bg-transparent border-none"
        >
          {resendLoading ? "Sending..." : "Didn't receive a code? Resend"}
        </button>
      </form>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <ConfirmForm />
      </Suspense>
    </main>
  )
}
