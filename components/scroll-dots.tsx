"use client"

import { useEffect, useState, useRef } from "react"

interface ScrollDotsProps {
  containerRef: React.RefObject<HTMLDivElement>
  itemCount: number
  className?: string
}

export default function ScrollDots({ containerRef, itemCount, className = "" }: ScrollDotsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const scrollWidth = container.scrollWidth
      const containerWidth = container.clientWidth
      const itemWidth = scrollWidth / itemCount

      // Calculate which item is most visible
      const currentIndex = Math.round(scrollLeft / itemWidth)
      setActiveIndex(Math.min(currentIndex, itemCount - 1))
    }

    container.addEventListener("scroll", handleScroll)
    handleScroll() // Initial calculation

    return () => {
      container.removeEventListener("scroll", handleScroll)
    }
  }, [containerRef, itemCount])

  const scrollToIndex = (index: number) => {
    const container = containerRef.current
    if (!container) return

    const scrollWidth = container.scrollWidth
    const itemWidth = scrollWidth / itemCount
    const targetScroll = index * itemWidth

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    })
  }

  if (itemCount <= 1) return null

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 ${className}`}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <button
          key={index}
          onClick={() => scrollToIndex(index)}
          className={`transition-all duration-300 rounded-full ${
            index === activeIndex
              ? "w-2.5 h-2.5 bg-accent"
              : "w-2 h-2 bg-white/30 hover:bg-white/50"
          }`}
          aria-label={`Navigate to item ${index + 1}`}
        />
      ))}
    </div>
  )
}

