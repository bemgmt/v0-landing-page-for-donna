"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface DinSidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string | number
}

export function DinSidebarItem({ href, icon, label, badge }: DinSidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/din" && pathname?.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        "hover:bg-white/[0.06] hover:text-white",
        isActive
          ? "bg-white/[0.08] text-white border border-white/10 shadow-[0_0_12px_rgba(56,189,248,0.08)]"
          : "text-white/60 border border-transparent"
      )}
    >
      <span className={cn("w-4 h-4 shrink-0", isActive ? "text-cyan-400" : "text-white/40")}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </Link>
  )
}
