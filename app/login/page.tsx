import type { Metadata } from "next"
import { redirect } from "next/navigation"
import LoginPanel from "@/components/auth/login-panel"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logAuthEvent } from "@/lib/auth/diagnostics"
import { safeReturnPath } from "@/lib/auth/return-path"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Member and Strategic Partner sign-in",
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string; mode?: string; correlationId?: string }>
}) {
  const params = await searchParams
  let nextPath = safeReturnPath(params.next)
  if (params.mode === "partner" && nextPath === "/portal") {
    nextPath = "/partner"
  }

  const session = await getServerSession(authOptions)
  if (session?.user) {
    redirect(nextPath)
  }

  // Handle OAuth errors and correlation ID generation
  if (params.error && !params.correlationId && params.error !== "oauth") {
    const correlationId = `err-${Date.now()}`
    let decodedReason = ""
    try {
      if (params.reason) decodedReason = decodeURIComponent(params.reason)
    } catch {
      // ignore
    }

    // Treat CONFIRMED as success and redirect cleanly
    if (decodedReason.includes("Current status is CONFIRMED")) {
      redirect(`/login?error=oauth&reason=${encodeURIComponent(decodedReason)}`)
    }

    if (decodedReason.includes("UserNotConfirmedException")) {
      redirect(`/login?error=oauth&reason=${encodeURIComponent(decodedReason)}`)
    }

    await logAuthEvent({
      event_name: "redirect_callback_error",
      correlation_id: correlationId,
      environment: process.env.NODE_ENV || "development",
      is_success: false,
      error_message: `${params.error} - ${decodedReason}`,
      endpoint: "/login",
      has_session: false,
    })

    // Redirect to a clean login URL with the correlation ID
    redirect(`/login?correlationId=${correlationId}`)
  }

  let decodedReason = ""
  if (typeof params.reason === "string") {
    try {
      decodedReason = decodeURIComponent(params.reason)
    } catch {
      // ignore
    }
  }

  const isConfirmedSuccess = params.error === "oauth" && decodedReason.includes("Current status is CONFIRMED")
  const isNotConfirmed = params.error === "oauth" && decodedReason.includes("UserNotConfirmedException")

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
        <p className="text-xs text-muted-foreground text-center mb-4">
          Sign in securely with your email and password.
        </p>
        
        {params.correlationId && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-red-400 font-semibold">Sign-in failed.</p>
            <p className="text-xs text-red-400/80 mt-1">If this persists, please contact support with code: <span className="font-mono text-red-300">{params.correlationId}</span></p>
          </div>
        )}

        {isConfirmedSuccess ? (
          <p className="text-sm text-emerald-400 text-center mb-4">You&apos;re all set - please sign in.</p>
        ) : isNotConfirmed ? (
          <p className="text-sm text-amber-400 text-center mb-4">
            Your account was not confirmed. Please <a href="/signup/confirm" className="underline hover:text-amber-300">confirm your account</a>.
          </p>
        ) : null}

        <LoginPanel nextFromUrl={nextPath} />
        
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Don&apos;t have an account?</p>
          <a
            href="/signup"
            className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium transition-colors border border-white/10"
          >
            Create account
          </a>
        </div>
      </div>
      <a href="/" className="mt-10 text-sm text-muted-foreground hover:text-cyan-300 transition-colors">
        ← Back to site
      </a>
    </main>
  )
}
