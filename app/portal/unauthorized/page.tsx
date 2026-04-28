import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-2">Not authorized</h1>
      <p className="text-sm text-muted-foreground mb-6">
        You are signed in, but the Strategic Partner Network requires partner access, an active subscription, or a team
        seat. If you need partner access, contact DONNA staff.
      </p>
      <div className="flex flex-col gap-3 text-sm">
        <Link href="/portal" className="text-cyan-300 hover:underline">
          Member portal home
        </Link>
        <Link href="/login?mode=partner" className="text-muted-foreground hover:text-cyan-300">
          Sign in as strategic partner
        </Link>
      </div>
    </div>
  )
}
