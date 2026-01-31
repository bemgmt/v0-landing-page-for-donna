"use client"

import { useEffect } from "react"

export default function ScrollbarFade() {
  useEffect(() => {
    const handleScroll = () => {
      // Get the first section (What DONNA Is)
      const firstSection = document.querySelector("section#what-donna-is")
      if (!firstSection) return

      const scrollY = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
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

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return null
}

