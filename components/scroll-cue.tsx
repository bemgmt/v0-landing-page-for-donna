"use client"

import { useEffect, useState } from "react"

export default function ScrollCue() {
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)

    // Listen for intro completion
    const handleIntroComplete = () => {
      setIsVisible(true)
    }

    window.addEventListener("introComplete", handleIntroComplete)

    // Check if intro was already skipped (localStorage check)
    const introSeen = localStorage.getItem("donnaIntroSeen") === "1"
    if (introSeen) {
      setIsVisible(true)
    }

    return () => {
      window.removeEventListener("introComplete", handleIntroComplete)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      id="scrollCue"
      className={`scrollCue fixed left-0 right-0 bottom-6 z-50 flex flex-col items-center gap-1.5 pointer-events-none ${
        isVisible ? "show" : ""
      }`}
      aria-hidden="true"
    >
      <div
        className={`scrollText text-xs font-semibold tracking-wider text-white/85 ${
          reducedMotion ? "" : "animate-pulse-cue"
        }`}
      >
        SCROLL
      </div>
      <div
        className={`scrollArrows text-xs font-semibold tracking-wider text-white/85 ${
          reducedMotion ? "" : "animate-pulse-cue"
        }`}
      >
        ↓ ↓ ↓
      </div>
    </div>
  )
}

