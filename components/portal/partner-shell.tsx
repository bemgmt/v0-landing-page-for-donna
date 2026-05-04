"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { MemberRole } from "@/lib/auth/roles"
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
        const active = pathname === item.href || (item.href !== "/partner" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
              active
                ? "bg-white/10 border border-cyan-500/30 text-foreground"
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

export default function PartnerShell({
  role,
  subscriptionActive: _subscriptionActive,
  seatAccess,
  displayName,
  children,
}: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const sales: NavItem[] = [
    { href: "/partner", label: "Command center" },
    { href: "/partner/sales", label: "Sales" },
    { href: "/partner/leads/round-robin", label: "Round robin" },
    { href: "/partner/leads/claim", label: "Claim a sale" },
  ]
  
  const community: NavItem[] = [
    { href: "/partner/live-chat", label: "Live Chat" },
    { href: "/partner/forum", label: "Forum" },
  ]
  
  const enablement: NavItem[] = [
    { href: "/partner/content", label: "Content" },
    { href: "/partner/socials", label: "Socials" },
    { href: "/partner/documents", label: "Documents" },
    { href: "/partner/knowledge", label: "Knowledge Base" },
  ]

  const adminNav = role === "admin" ? [{ href: "/admin", label: "Admin Portal" }] : []

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-white/10 liquid-glass md:min-h-screen p-4 flex flex-col gap-5">
        <div>
          <Link href="/partner" className="text-lg font-semibold gradient-text leading-tight block">
            Strategic Partner Network
          </Link>
          <p className="text-[11px] uppercase tracking-wider text-cyan-400/70 mt-1">Staff Access</p>
          <p className="text-xs text-muted-foreground mt-2 truncate">{displayName ?? "Partner"}</p>
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
          className={`flex-col gap-4 ${mobileOpen ? "flex" : "hidden"} md:flex md:flex-col`}
          aria-label="Partner"
        >
          <NavSection title="Sales" items={sales} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection title="Support" items={community} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection title="Enablement" items={enablement} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          
          {adminNav.length ? (
            <NavSection title="Admin" items={adminNav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          ) : null}
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-white/10 md:border-0 md:pt-0">
          <Link
            href="/portal"
            className="text-xs text-muted-foreground hover:text-cyan-300 px-1 py-1"
          >
            ← Member portal
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
