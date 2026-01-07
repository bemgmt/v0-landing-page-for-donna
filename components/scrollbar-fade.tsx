"use client"

import { useEffect } from "react"

export default function ScrollbarFade() {
  useEffect(() => {
    const main = document.querySelector("main.snap")
    if (!main) return

    const handleScroll = () => {
      // Get the first section (What DONNA Does - SectionCapabilities)
      const firstSection = document.querySelector("section#capabilities")
      
      if (!firstSection) return

      const scrollY = (main as HTMLElement).scrollTop
      const heroHeight = window.innerHeight

      // Fade scrollbar when we've scrolled past 80% of hero section
      // and are approaching or in the first section
      if (scrollY > heroHeight * 0.8) {
        document.body.classList.add("scrolled-to-first-section")
      } else {
        document.body.classList.remove("scrolled-to-first-section")
      }
    }

    main.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => {
      main.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return null
}

