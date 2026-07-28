import Link from "next/link"

export default function PortalNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-black/40 p-8 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">Page not found</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">That portal page does not exist</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The address may be outdated or incomplete. Your account is still signed in and you can continue from the
        member dashboard.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/portal"
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-300"
        >
          Return to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-foreground transition-colors hover:border-cyan-300/60 hover:text-cyan-200"
        >
          Visit marketing site
        </Link>
      </div>
    </div>
  )
}
