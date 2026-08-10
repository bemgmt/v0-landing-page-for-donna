import type { Metadata } from "next"
import Link from "next/link"
import { SkipLink } from "@/components/skip-link"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground"
      >
        <div className="max-w-lg text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">404</p>
          <h1 className="mt-4 text-4xl font-bold">Page not found</h1>
          <p className="mt-4 text-foreground/70">
            The page may have moved, or the address may be incorrect.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-3 font-semibold text-background transition-opacity hover:opacity-90"
            >
              Return home
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-5 py-3 font-semibold transition-colors hover:border-accent/50 hover:text-accent"
            >
              Contact DONNA
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
