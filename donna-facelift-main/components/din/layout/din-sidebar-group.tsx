"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DinSidebarGroupProps {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function DinSidebarGroup({ label, children, defaultOpen = true }: DinSidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-white/35 hover:text-white/50 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-0.5 px-1">{children}</div>
      </div>
    </div>
  )
}
