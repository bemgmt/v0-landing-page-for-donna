import Link from "next/link"

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold gradient-text">Admin Command Center</h1>
      <p className="text-sm text-muted-foreground">
        High-level oversight, user management, and intelligence tools.
      </p>
      
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground px-1">Operations</h2>
          <div className="grid gap-3">
            <Link
              href="/admin/members"
              className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30 transition-colors"
            >
              <p className="font-medium">Members</p>
              <p className="text-xs text-muted-foreground mt-1">Manage users, profiles, and billing seats</p>
            </Link>
            <Link
              href="/admin/partners"
              className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30 transition-colors"
            >
              <p className="font-medium">Partners</p>
              <p className="text-xs text-muted-foreground mt-1">Strategic Partner Network management</p>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground px-1">Intelligence</h2>
          <div className="grid gap-3">
            <Link
              href="/admin/flow"
              className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30 transition-colors"
            >
              <p className="font-medium text-cyan-300">Flow Studio</p>
              <p className="text-xs text-muted-foreground mt-1">Generate branded marketing collateral</p>
            </Link>
            <Link
              href="/admin/seo"
              className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30 transition-colors"
            >
              <p className="font-medium text-cyan-300">SEO Analytics</p>
              <p className="text-xs text-muted-foreground mt-1">Google Search Console performance data</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
