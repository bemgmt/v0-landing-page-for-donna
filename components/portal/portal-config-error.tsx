/**
 * Shown when NEXT_PUBLIC_SUPABASE_* are missing — member portal cannot initialize.
 */
export default function PortalConfigError() {
  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-amber-500/30 p-8 shadow-xl text-center">
        <h1 className="text-xl font-semibold text-amber-200 mb-3">Member Portal unavailable</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This deployment is missing Supabase configuration. Add{" "}
          <code className="text-xs bg-white/10 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-xs bg-white/10 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to the hosting environment, then redeploy.
        </p>
        <a href="/" className="mt-8 inline-block text-sm text-cyan-300 hover:text-cyan-200 transition-colors">
          ← Back to site
        </a>
      </div>
    </main>
  )
}
