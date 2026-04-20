import Link from "next/link"
import type { MemberRole } from "@/lib/auth/roles"
import SignOutButton from "@/components/portal/sign-out-button"

type Props = {
  role: MemberRole
  children: React.ReactNode
}

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/forum", label: "Forum" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/live-chat", label: "Live chat" },
]

export default function AdminShell({ role, children }: Props) {
  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
      <aside className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-white/10 liquid-glass p-4 flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Staff</p>
          <Link href="/admin" className="text-lg font-semibold gradient-text">
            DONNA Admin
          </Link>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{role}</p>
        </div>
        <nav className="flex flex-row md:flex-col flex-wrap gap-2 md:gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 flex flex-col gap-3">
          <Link href="/portal" className="text-xs text-muted-foreground hover:text-cyan-300">
            Member portal
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  )
}
