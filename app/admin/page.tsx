import Link from "next/link"

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold gradient-text">Admin overview</h1>
      <p className="text-sm text-muted-foreground">
        Moderate forum content, manage leads and claims, and respond to live chat queues.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/live-chat"
          className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30"
        >
          <p className="font-medium">Live chat</p>
          <p className="text-xs text-muted-foreground mt-1">Take over AI sessions</p>
        </Link>
        <Link href="/admin/leads" className="rounded-xl border border-white/10 liquid-glass p-4 hover:border-cyan-400/30">
          <p className="font-medium">Leads</p>
          <p className="text-xs text-muted-foreground mt-1">Round-robin assignment</p>
        </Link>
      </div>
    </div>
  )
}
