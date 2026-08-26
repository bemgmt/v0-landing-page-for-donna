"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { onPricingCtaNavClick } from "@/lib/pricing-cta-nav"

export default function MinimalHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled ? "liquid-glass border-b border-white/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" aria-label="DONNA home">
            <Image
              src="/brand/full/donna-logo-512.png"
              alt="DONNA Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-lg font-bold gradient-text">DONNA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-foreground/65" aria-label="Primary navigation">
            <Link href="/#network" className="hover:text-foreground transition-colors">Network</Link>
            <Link href="/#connected-transaction" className="hover:text-foreground transition-colors">Transaction</Link>
            <Link href="/#product" className="hover:text-foreground transition-colors">Product</Link>
            <Link href="/#associations" className="hover:text-foreground transition-colors">Associations</Link>
            <Link href="/#trust" className="hover:text-foreground transition-colors">Trust</Link>
            <Link href="/investors" className="hover:text-foreground transition-colors">Investors</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="hidden shrink-0 text-sm text-muted-foreground transition-colors hover:text-cyan-300 md:inline-flex"
            >
              Member Portal
            </Link>
            <Link
              href="/signup"
              className="hidden shrink-0 text-sm text-muted-foreground transition-colors hover:text-cyan-300 md:inline-flex"
            >
              Create account
            </Link>
            <Link
              href="/#pricing"
              onClick={(e) => onPricingCtaNavClick("header", e)}
              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all animated-edge-button hover:bg-white/20 sm:px-4"
            >
              <span className="relative z-10">Join the Network</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
