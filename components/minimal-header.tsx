"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "liquid-glass border-b border-white/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Image
              src="/DONNA-logo.png"
              alt="DONNA Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-lg font-bold gradient-text">DONNA</span>
          </div>
          <button
            onClick={() => {
              const form = document.getElementById("section-cta")
              form?.scrollIntoView({ behavior: "smooth" })
            }}
            className="px-4 py-2 rounded-lg liquid-glass text-sm font-medium hover:bg-white/20 transition-all"
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </header>
  )
}

