"use client"

import Link from "next/link"
import { useVertical } from "@/hooks/use-vertical"
import { type VerticalKey } from "@/lib/constants/verticals"
import { Building2, Calendar, Users, FileText, Briefcase, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  verticals: VerticalKey[]
}

const navItems: NavItem[] = [
  // Real Estate
  {
    href: "/protected/properties",
    label: "Properties",
    icon: <Building2 className="w-4 h-4" />,
    verticals: ["real_estate"]
  },
  {
    href: "/protected/showings",
    label: "Showings",
    icon: <Calendar className="w-4 h-4" />,
    verticals: ["real_estate"]
  },
  // Hospitality
  {
    href: "/protected/reservations",
    label: "Reservations",
    icon: <Calendar className="w-4 h-4" />,
    verticals: ["hospitality"]
  },
  {
    href: "/protected/guest-management",
    label: "Guest Management",
    icon: <Users className="w-4 h-4" />,
    verticals: ["hospitality"]
  },
  // Professional Services
  {
    href: "/protected/clients",
    label: "Clients",
    icon: <Users className="w-4 h-4" />,
    verticals: ["professional_services"]
  },
  {
    href: "/protected/projects",
    label: "Projects",
    icon: <Briefcase className="w-4 h-4" />,
    verticals: ["professional_services"]
  },
]

export function VerticalNavigation() {
  const { vertical, isLoading } = useVertical()

  if (isLoading) {
    return (
      <nav className="space-y-2">
        <div className="text-white/60 text-sm">Loading navigation...</div>
      </nav>
    )
  }

  if (!vertical) {
    return null
  }

  const filteredItems = navItems.filter(item => item.verticals.includes(vertical))

  if (filteredItems.length === 0) {
    return null
  }

  return (
    <nav className="space-y-1">
      {filteredItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg",
            "text-white/70 hover:text-white hover:bg-white/10",
            "transition-colors duration-200"
          )}
        >
          {item.icon}
          <span className="text-sm font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

