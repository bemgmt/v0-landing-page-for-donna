import type { Metadata } from "next"
import { redirect } from "next/navigation"
import LoginPanel from "@/components/auth/login-panel"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Member and Strategic Partner sign-in",
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string; mode?: string }>
}) {
  const params = await searchParams
  let nextPath = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/portal"
  if (params.mode === "partner" && nextPath === "/portal") {
    nextPath = "/partner"
  }

  const session = await getServerSession(authOptions)
  if (session?.user) {
    redirect(nextPath)
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
          Sign in with your email and password.
        </p>
        {isConfirmedSuccess ? (
          <p className="text-sm text-emerald-400 text-center mb-4">You&apos;re all set - please sign in.</p>
        ) : isNotConfirmed ? (
          <p className="text-sm text-amber-400 text-center mb-4">
            Your account was not confirmed. Please check your email for the confirmation code, or click &quot;Create account&quot; to sign up again and resend the code.
          </p>
        ) : params.error === "auth" ? (
          <p className="text-sm text-red-400 text-center mb-4">Sign-in failed. Try again.</p>
        ) : params.error === "oauth" ? (
          <p className="text-sm text-red-400 text-center mb-4">
            OAuth sign-in failed{decodedReason ? `: ${decodedReason.slice(0, 200)}` : "."}
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
