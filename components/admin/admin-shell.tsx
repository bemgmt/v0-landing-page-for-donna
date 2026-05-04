"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { MemberRole } from "@/lib/auth/roles"
import SignOutButton from "@/components/portal/sign-out-button"

type NavItem = { href: string; label: string }

type Props = {
  role: MemberRole
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
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
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

export default function AdminShell({ role, children }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const ops: NavItem[] = [
    { href: "/admin", label: "Command Center" },
    { href: "/admin/members", label: "Members" },
    { href: "/admin/partners", label: "Partners" },
  ]
  const intelligence: NavItem[] = [
    { href: "/admin/flow", label: "Flow Studio" },
    { href: "/admin/seo", label: "SEO Analytics" },
  ]

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/10 liquid-glass md:min-h-screen p-4 flex flex-col gap-5">
        <div>
          <Link href="/admin" className="text-lg font-semibold gradient-text">
            DONNA Admin
          </Link>
          <p className="text-[11px] uppercase tracking-wider text-cyan-400/70 mt-1">High-Level Operations</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/15 text-muted-foreground">
              {role.replace("_", " ")}
            </span>
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
          aria-label="Admin"
        >
          <NavSection title="Operations" items={ops} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection title="Intelligence" items={intelligence} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-white/10 md:border-0 md:pt-0">
          <Link href="/partner" className="text-xs text-muted-foreground hover:text-cyan-300 px-1 py-1">
            ← Staff portal
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
