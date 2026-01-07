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
      const scrollHeight = (main as HTMLElement).scrollHeight
      const clientHeight = (main as HTMLElement).clientHeight
      const heroHeight = window.innerHeight

      // Fade scrollbar when we've scrolled past 80% of hero section
      // but show it again near the bottom (last 20% of content) to access footer
      const nearBottom = scrollY + clientHeight >= scrollHeight - 200
      
      if (scrollY > heroHeight * 0.8 && !nearBottom) {
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

