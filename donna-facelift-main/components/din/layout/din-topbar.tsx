"use client"

import { usePathname } from "next/navigation"
import { Bell, User, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DinMobileSidebar } from "./din-mobile-sidebar"

const routeTitles: Record<string, string> = {
  "/din": "Dashboard",
  "/din/profile": "Profile",
  "/din/needs": "I Need A…",
  "/din/needs/submit-request": "Submit a Request",
  "/din/needs/open-bids": "Bid Board",
  "/din/needs/suggested-matches": "Suggested Matches",
  "/din/bids": "My Bids",
  "/din/bids/pending": "Pending Bids",
  "/din/bids/closing-soon": "Closing Soon",
  "/din/bids/previous": "Previous Bids",
  "/din/intelligence": "Intelligence",
  "/din/intelligence/skills": "Skills",
  "/din/forum": "Discussion Forum",
  "/din/settings": "Settings",
  "/din/settings/payment-profile": "Payment Profile",
  "/din/settings/automatic-bids": "Automatic Bids",
}

export function DinTopbar() {
  const pathname = usePathname()
  const title = routeTitles[pathname ?? ""] ?? "DONNA Intelligence Network"

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 md:px-6 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-[#0a0d14] border-r border-white/[0.06]">
            <DinMobileSidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-sm font-medium text-white/90">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400/80 bg-emerald-400/[0.06] border border-emerald-400/10 px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DIN Online</span>
        </div>
        <button className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </button>
        <button className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
