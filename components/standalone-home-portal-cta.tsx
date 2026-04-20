"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone)
}

/** In-flow strip on the marketing home page when opened as an installed PWA. */
export default function StandaloneHomePortalCta() {
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    setStandalone(isStandaloneDisplay())
  }, [])

  if (!standalone) return null

  return (
    <div className="relative z-[90] mt-16 border-b border-cyan-500/30 bg-black/90 px-4 py-2 text-center text-sm backdrop-blur-md">
      <span className="text-foreground/90">Need your workspace? </span>
      <Link
        href="/portal"
        className="font-semibold text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline"
      >
        Open Member Portal
      </Link>
    </div>
  )
}
