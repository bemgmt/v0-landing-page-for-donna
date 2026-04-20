"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: "Products", href: "#products" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
  ]

  return (
    <header className="fixed top-0 w-full z-50 glass-card border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="#" className="flex items-center gap-2 group">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-foreground/70 hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => {
                const form = document.getElementById("demo-form")
                form?.scrollIntoView({ behavior: "smooth" })
              }}
              className="px-4 py-2 rounded-lg bg-accent text-background hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              Book a discovery call
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-foreground/70 hover:text-accent transition-colors py-2"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const form = document.getElementById("demo-form")
                  form?.scrollIntoView({ behavior: "smooth" })
                  setIsOpen(false)
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-accent text-background text-sm font-medium"
              >
                Book a discovery call
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

