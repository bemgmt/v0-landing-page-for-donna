import type { Metadata } from "next"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in — DONNA",
  description: "Member and partner portal sign-in",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/portal"

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold gradient-text mb-2 text-center">DONNA Portal</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Enter your email to receive a magic link.
        </p>
        {params.error === "auth" ? (
          <p className="text-sm text-red-400 text-center mb-4">Sign-in failed. Try again.</p>
        ) : null}
        <LoginForm nextPath={nextPath} />
      </div>
      <a href="/" className="mt-10 text-sm text-muted-foreground hover:text-cyan-300 transition-colors">
        ← Back to site
      </a>
    </main>
  )
}
