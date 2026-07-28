"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Signup failed")
      }

      if (data.userConfirmed) {
        // Automatically route to login if already confirmed somehow
        router.push(`/login?email=${encodeURIComponent(email)}`)
      } else {
        router.push(`/signup/confirm?email=${encodeURIComponent(email)}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold gradient-text text-center mb-2">Create your account</h1>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Sign up with your email to get started.
        </p>
        
        {error && (
          <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email address
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg liquid-glass-clear border border-white/10 focus:border-cyan-400 focus:outline-none transition-colors text-foreground"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-muted-foreground mb-1">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg liquid-glass-clear border border-white/10 focus:border-cyan-400 focus:outline-none transition-colors text-foreground"
              placeholder="Min 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-lg animated-edge-button px-4 py-2.5 text-sm font-medium disabled:opacity-60 w-full"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Already have an account?</p>
          <a
            href="/login"
            className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium transition-colors border border-white/10"
          >
            Sign in
          </a>
        </div>
      </div>
    </main>
  )
}
