"use client"

import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">
          AI operational infrastructure for real estate
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/60">
          <Link href="/return-policy" className="hover:text-foreground transition-colors">
            Return Policy
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/security" className="hover:text-foreground transition-colors">
            Security
          </Link>
          <Link href="mailto:info@bemdonna.com" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>
        <p className="text-xs text-foreground/40">© {currentYear} DONNA. All rights reserved.</p>
      </div>
    </footer>
  )
}
