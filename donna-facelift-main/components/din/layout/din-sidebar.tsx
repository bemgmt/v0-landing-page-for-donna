"use client"

import {
  ArrowLeft,
  User,
  FileText,
  Search,
  Sparkles,
  Gavel,
  AlertTriangle,
  History,
  TrendingUp,
  Zap,
  MessageSquare,
  Settings,
  CreditCard,
  Bot,
} from "lucide-react"
import { DinSidebarItem } from "./din-sidebar-item"
import { DinSidebarGroup } from "./din-sidebar-group"
import Link from "next/link"

export function DinSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden md:flex h-screen w-64 flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-xl">
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-[#0C0F16]">
            D
          </div>
          <div>
            <span className="text-sm font-semibold text-white/90">DONNA</span>
            <span className="block text-[10px] text-white/40">Intelligence Network</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] mx-4" />

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        <div className="mb-3">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to DONNA</span>
          </Link>
        </div>

        <DinSidebarItem href="/din/profile" icon={<User className="w-4 h-4" />} label="Profile" />

        <DinSidebarGroup label="I need a…">
          <DinSidebarItem href="/din/needs/submit-request" icon={<FileText className="w-4 h-4" />} label="Submit a request" />
          <DinSidebarItem href="/din/needs/open-bids" icon={<Search className="w-4 h-4" />} label="Search open bids" />
          <DinSidebarItem href="/din/needs/suggested-matches" icon={<Sparkles className="w-4 h-4" />} label="View suggested matches" badge={6} />
        </DinSidebarGroup>

        <DinSidebarGroup label="My Bids">
          <DinSidebarItem href="/din/bids/pending" icon={<Gavel className="w-4 h-4" />} label="Pending" badge={3} />
          <DinSidebarItem href="/din/bids/closing-soon" icon={<AlertTriangle className="w-4 h-4" />} label="About to close" badge={3} />
          <DinSidebarItem href="/din/bids/previous" icon={<History className="w-4 h-4" />} label="Previous bids" />
        </DinSidebarGroup>

        <DinSidebarGroup label="Intelligence">
          <DinSidebarItem href="/din/intelligence" icon={<TrendingUp className="w-4 h-4" />} label="Trends overview" />
          <DinSidebarItem href="/din/intelligence/skills" icon={<Zap className="w-4 h-4" />} label="Skills" />
        </DinSidebarGroup>

        <DinSidebarItem href="/din/forum" icon={<MessageSquare className="w-4 h-4" />} label="Discussion forum" />

        <DinSidebarGroup label="Settings">
          <DinSidebarItem href="/din/settings" icon={<Settings className="w-4 h-4" />} label="General" />
          <DinSidebarItem href="/din/settings/payment-profile" icon={<CreditCard className="w-4 h-4" />} label="Payment profile" />
          <DinSidebarItem href="/din/settings/automatic-bids" icon={<Bot className="w-4 h-4" />} label="Automatic bids" />
        </DinSidebarGroup>
      </nav>

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] text-white/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DIN Online</span>
        </div>
      </div>
    </aside>
  )
}
