"use client"

import Link from "next/link"
import { pushDataLayer } from "@/lib/data-layer"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">
          AI operational infrastructure for SMBs
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/60">
          <Link href="/what-is-donna" className="hover:text-foreground transition-colors">
            What is DONNA
          </Link>
          <Link href="/early-adopter-program" className="hover:text-foreground transition-colors">
            Early Adopter Program
          </Link>
          <Link href="/donna-intelligence-network" className="hover:text-foreground transition-colors">
            Intelligence Network
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/industries/real-estate" className="hover:text-foreground transition-colors">
            Real estate
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
          <Link href="/return-policy" className="hover:text-foreground transition-colors">
            Return Policy
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/security" className="hover:text-foreground transition-colors">
            Security
          </Link>
          <a
            href="mailto:info@bemdonna.com"
            className="hover:text-foreground transition-colors"
            onClick={() =>
              pushDataLayer({ event: "outbound_click", link_url: "mailto:info@bemdonna.com", link_text: "email" })
            }
          >
            Email
          </a>
        </div>
        <p className="text-xs text-foreground/40">© {currentYear} DONNA. All rights reserved.</p>
      </div>
    </footer>
  )
}
