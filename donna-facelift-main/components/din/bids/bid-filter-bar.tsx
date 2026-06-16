"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface BidFilterBarProps {
  activeBidsOnly: boolean
  onToggleActive: (val: boolean) => void
  searchValue: string
  onSearchChange: (val: string) => void
}

export function BidFilterBar({ activeBidsOnly, onToggleActive, searchValue, onSearchChange }: BidFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <FilterSelect label="Project Type: All" />
      <FilterSelect label="Budget: Range" />
      <FilterSelect label="Skills" />

      <div className="relative flex-1 min-w-[140px] max-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          type="text"
          placeholder="Search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-white/50">Active Bids</span>
        <button
          onClick={() => onToggleActive(!activeBidsOnly)}
          className={cn(
            "relative w-10 h-5 rounded-full transition-colors duration-200",
            activeBidsOnly ? "bg-cyan-500/40" : "bg-white/10"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
              activeBidsOnly ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    </div>
  )
}

function FilterSelect({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:border-white/15 transition-colors">
      <span>{label}</span>
      <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}
