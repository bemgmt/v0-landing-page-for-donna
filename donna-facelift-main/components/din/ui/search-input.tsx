"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  placeholder?: string
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchInput({ placeholder = "Search", className, value, onChange }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30 focus:shadow-[0_0_12px_rgba(6,182,212,0.06)] transition-all"
      />
    </div>
  )
}
