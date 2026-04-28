import type { Metadata } from "next"
import { redirect } from "next/navigation"
import LoginPanel from "@/components/auth/login-panel"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Sign in — DONNA",
  description: "Member and Strategic Partner sign-in",
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url?.trim() && anon?.trim()) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        redirect(nextPath)
      }
    } catch {
      /* missing env or cookie edge cases — show login */
    }
  }

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
        <p className="text-xs text-muted-foreground text-center mb-4">
          Sign in with Google, email and password, or a magic link.
        </p>
        {params.error === "auth" ? (
          <p className="text-sm text-red-400 text-center mb-4">Sign-in failed. Try again.</p>
        ) : null}
        {params.error === "oauth" ? (
          <p className="text-sm text-red-400 text-center mb-4">
            OAuth sign-in failed
            {typeof params.reason === "string" && params.reason.length > 0
              ? (() => {
                  try {
                    return `: ${decodeURIComponent(params.reason).slice(0, 200)}`
                  } catch {
                    return "."
                  }
                })()
              : "."}
          </p>
        ) : null}
        <LoginPanel nextFromUrl={nextPath} />
      </div>
      <a href="/" className="mt-10 text-sm text-muted-foreground hover:text-cyan-300 transition-colors">
        ← Back to site
      </a>
    </main>
  )
}
