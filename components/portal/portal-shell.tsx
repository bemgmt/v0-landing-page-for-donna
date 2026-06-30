"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { MemberRole } from "@/lib/auth/roles"
import { hasPartnerCapabilities } from "@/lib/auth/roles"
import SignOutButton from "@/components/portal/sign-out-button"

type NavItem = { href: string; label: string }

type Props = {
  role: MemberRole
  subscriptionActive: boolean
  seatAccess: boolean
  displayName: string | null
  children: React.ReactNode
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3">{title}</p>
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
              active
                ? "bg-white/10 border border-cyan-500/25 text-foreground"
                : "border border-transparent hover:bg-white/5 hover:border-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function PortalShell({ role, subscriptionActive, seatAccess, displayName, children }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const partner = hasPartnerCapabilities(role, subscriptionActive)
  
  const account: NavItem[] = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/profile", label: "Profile" },
    { href: "/portal/billing", label: "Billing & seats" },
  ]
  const support: NavItem[] = [
    { href: "/portal/can-donna", label: "Can DONNA" },
    { href: "/portal/support", label: "Support chat" },
  ]
  
  const partnerLink: NavItem[] = partner ? [{ href: "/partner", label: "Staff / Partner Portal" }] : []
  const adminLink: NavItem[] = role === "admin" ? [{ href: "/admin", label: "Admin Portal" }] : []

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/10 liquid-glass md:min-h-screen p-4 flex flex-col gap-5">
        <div>
          <Link href="/portal" className="text-lg font-semibold gradient-text">
            DONNA Member Portal
          </Link>
          <p className="text-[11px] uppercase tracking-wider text-cyan-400/70 mt-1">General access</p>
          <p className="text-xs text-muted-foreground mt-2 truncate">{displayName ?? "Member"}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/15 text-muted-foreground">
              {role.replace("_", " ")}
            </span>
            {seatAccess ? (
              <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-200/90">
                Team seat
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="md:hidden text-left text-sm px-3 py-2 rounded-lg border border-white/15 bg-white/5"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Hide menu" : "Menu"}
        </button>

        <nav
          className={`flex-col gap-4 ${mobileOpen ? "flex" : "hidden"} md:flex`}
          aria-label="Member portal"
        >
          <div className="px-3 pb-2">
            <a
              href="https://app.bemdonna.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-lg text-sm font-medium hover:bg-cyan-500/20 hover:border-cyan-400/40 transition-colors"
            >
              Go to DONNA app
            </a>
          </div>

          <NavSection title="Account" items={account} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection title="Help & Support" items={support} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          
          {partnerLink.length ? (
            <NavSection title="Staff" items={partnerLink} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          ) : null}
          {adminLink.length ? (
            <NavSection title="Admin" items={adminLink} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          ) : null}
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-white/10 md:border-0 md:pt-0">
          <Link href="/" className="text-xs text-muted-foreground hover:text-cyan-300 px-1">
            ← Marketing site
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
