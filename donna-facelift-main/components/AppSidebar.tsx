"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useVertical } from "@/hooks/use-vertical"
import { VERTICALS, type VerticalKey } from "@/lib/constants/verticals"
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  Briefcase,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  tooltip: string
  description?: string
}

const commonNavItems: NavItem[] = [
  {
    href: "/protected",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    tooltip: "Dashboard",
    description: "Your vertical-specific overview: metrics, leads, and quick actions",
  },
  {
    href: "/",
    label: "DONNA Grid",
    icon: <Brain className="w-4 h-4" />,
    tooltip: "Main Grid",
    description: "AI-powered main interface: email, analytics, and chat",
  },
]

interface VerticalNavItem extends NavItem {
  verticals: VerticalKey[]
}

const verticalNavItems: VerticalNavItem[] = [
  {
    href: "/protected/properties",
    label: "Properties",
    icon: <Building2 className="w-4 h-4" />,
    tooltip: "Properties",
    description: "Manage listings, details, and property inventory",
    verticals: ["real_estate"],
  },
  {
    href: "/protected/showings",
    label: "Showings",
    icon: <Calendar className="w-4 h-4" />,
    tooltip: "Showings",
    description: "Schedule and track property viewings",
    verticals: ["real_estate"],
  },
  {
    href: "/protected/reservations",
    label: "Reservations",
    icon: <Calendar className="w-4 h-4" />,
    tooltip: "Reservations",
    description: "Manage bookings and availability",
    verticals: ["hospitality"],
  },
  {
    href: "/protected/guest-management",
    label: "Guest Management",
    icon: <Users className="w-4 h-4" />,
    tooltip: "Guest Management",
    description: "Guest profiles, preferences, and stay history",
    verticals: ["hospitality"],
  },
  {
    href: "/protected/clients",
    label: "Clients",
    icon: <Users className="w-4 h-4" />,
    tooltip: "Clients",
    description: "Client database and relationship tracking",
    verticals: ["professional_services"],
  },
  {
    href: "/protected/projects",
    label: "Projects",
    icon: <Briefcase className="w-4 h-4" />,
    tooltip: "Projects",
    description: "Project pipeline and deliverables",
    verticals: ["professional_services"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { vertical, isLoading } = useVertical()
  const { state } = useSidebar()

  const isCollapsed = state === "collapsed"

  const verticalLabel = vertical
    ? VERTICALS.find((v) => v.key === vertical)?.label
    : null

  const filteredVerticalItems = vertical
    ? verticalNavItems.filter((item) => item.verticals.includes(vertical))
    : []

  const isActive = (href: string) => {
    if (href === "/protected") return pathname === "/protected"
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href) ?? false
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="donna-sidebar border-r-0"
    >
      <SidebarHeader className="px-3 py-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--donna-purple)] to-[var(--donna-cyan)] flex items-center justify-center text-xs font-bold text-[#0C0F16]">
              D
            </div>
            <span className="text-sm font-semibold text-white/90 truncate">
              {verticalLabel ? `DONNA · ${verticalLabel}` : "DONNA"}
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarSeparator className="bg-white/10 mx-3" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 uppercase text-[10px] tracking-wider font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={
                      item.description
                        ? {
                            children: (
                              <span>
                                <span className="font-medium">{item.label}</span>
                                <span className="block text-[10px] opacity-80 mt-0.5">
                                  {item.description}
                                </span>
                              </span>
                            ),
                          }
                        : item.tooltip
                    }
                    className={cn(
                      "text-white/60 hover:text-white hover:bg-white/8",
                      isActive(item.href) &&
                        "text-white bg-white/10 border border-white/10"
                    )}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredVerticalItems.length > 0 && (
          <>
            <SidebarSeparator className="bg-white/10 mx-3" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 uppercase text-[10px] tracking-wider font-semibold">
                {verticalLabel ?? "Modules"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredVerticalItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={
                          item.description
                            ? {
                                children: (
                                  <span>
                                    <span className="font-medium">{item.label}</span>
                                    <span className="block text-[10px] opacity-80 mt-0.5">
                                      {item.description}
                                    </span>
                                  </span>
                                ),
                              }
                            : item.tooltip
                        }
                        className={cn(
                          "text-white/60 hover:text-white hover:bg-white/8",
                          isActive(item.href) &&
                            "text-white bg-white/10 border border-white/10"
                        )}
                      >
                        <Link href={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {isLoading && !isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <div className="h-2 bg-white/10 rounded animate-pulse w-3/4 mb-2" />
                <div className="h-2 bg-white/10 rounded animate-pulse w-1/2" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {!isCollapsed && vertical && (
          <div className="px-1 py-1.5 rounded-lg bg-white/5 border border-white/8">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
              Active Vertical
            </p>
            <p className="text-xs text-white/70 mt-0.5 truncate">
              {verticalLabel}
            </p>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
