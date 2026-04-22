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

    window.addEventListener("scroll", handleScroll)
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
          <div className="flex items-center gap-2">
            <Image
              src="/brand/full/donna-logo-512.png"
              alt="DONNA Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-lg font-bold gradient-text">DONNA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="text-xs sm:text-sm text-muted-foreground hover:text-cyan-300 transition-colors shrink-0"
            >
              <span className="sm:hidden">Portal</span>
              <span className="hidden sm:inline">Member Portal</span>
            </Link>
            <Link
              href="/#pricing"
              onClick={(e) => onPricingCtaNavClick("header", e)}
              className="px-4 py-2 rounded-lg animated-edge-button text-sm font-medium hover:bg-white/20 transition-all relative inline-flex items-center justify-center"
            >
              <span className="relative z-10">Get DONNA</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
