import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground mb-2">Not authorized</h1>
      <p className="text-sm text-muted-foreground mb-6">
        You are signed in, but this area requires a different membership level or staff access.
      </p>
      <Link href="/portal" className="text-cyan-300 hover:underline text-sm">
        Back to portal home
      </Link>
    </div>
  )
}
