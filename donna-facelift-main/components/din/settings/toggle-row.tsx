"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ToggleRowProps {
  label: string
  description: string
  defaultValue?: boolean
}

export function ToggleRow({ label, description, defaultValue = false }: ToggleRowProps) {
  const [enabled, setEnabled] = useState(defaultValue)

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm text-white/70">{label}</p>
        <p className="text-xs text-white/30 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
          enabled ? "bg-cyan-500/40" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}
