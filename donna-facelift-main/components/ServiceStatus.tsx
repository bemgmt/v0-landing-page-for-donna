"use client"

// Shell version - visual only, no API calls
export default function ServiceStatus() {
  return (
    <div className="flex items-center gap-2 text-xs text-white/70" role="status" aria-live="polite">
      <span className="inline-block w-2 h-2 rounded-full bg-donna-cyan glow-cyan"></span>
      <span>Design Preview Mode</span>
    </div>
  )
}

