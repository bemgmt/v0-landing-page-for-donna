import Link from "next/link"
import type { MemberRole } from "@/lib/auth/roles"
import { hasPartnerCapabilities } from "@/lib/auth/roles"
import SignOutButton from "@/components/portal/sign-out-button"

type NavItem = { href: string; label: string }

function navForRole(role: MemberRole, subscriptionActive: boolean): NavItem[] {
  const partner = hasPartnerCapabilities(role, subscriptionActive)
  const base: NavItem[] = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/profile", label: "Profile" },
    { href: "/portal/can-donna", label: "Can DONNA" },
    { href: "/portal/documents", label: "Documents" },
    { href: "/portal/socials", label: "Socials" },
    { href: "/portal/forum", label: "Forum" },
    { href: "/portal/support", label: "Support chat" },
  ]
  if (!partner) return base
  return [
    ...base,
    { href: "/portal/sales", label: "Sales" },
    { href: "/portal/leads/claim", label: "Claim a sale" },
    { href: "/portal/leads/round-robin", label: "Round robin" },
  ]
}

type Props = {
  role: MemberRole
  subscriptionActive: boolean
  displayName: string | null
  children: React.ReactNode
}

export default function PortalShell({ role, subscriptionActive, displayName, children }: Props) {
  const items = navForRole(role, subscriptionActive)

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/10 liquid-glass md:min-h-screen p-4 flex flex-col gap-6">
        <div>
          <Link href="/portal" className="text-lg font-semibold gradient-text">
            DONNA Portal
          </Link>
          <p className="text-xs text-muted-foreground mt-1 truncate">{displayName ?? "Member"}</p>
          <span className="inline-block mt-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/15 text-muted-foreground">
            {role.replace("_", " ")}
          </span>
        </div>
        <nav className="flex flex-row md:flex-col flex-wrap gap-2 md:gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 flex flex-col gap-3">
          <Link href="/" className="text-xs text-muted-foreground hover:text-cyan-300">
            ← Marketing site
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-white/10 px-4 py-3 liquid-glass md:hidden">
          <span className="text-sm font-medium">Menu — use desktop for full nav</span>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
