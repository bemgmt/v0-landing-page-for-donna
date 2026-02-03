"use client"

import { useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { useInView } from "react-intersection-observer"

interface StackedLayersVisualizationProps {
  className?: string
}

export default function StackedLayersVisualization({ className = "" }: StackedLayersVisualizationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { ref: inViewRef, inView } = useInView({ threshold: 0.25, once: true })

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      inViewRef(node)
      containerRef.current = node
    },
    [inViewRef]
  )

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof window === "undefined") return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      node.style.setProperty("--stack-stretch", "1")
      node.style.setProperty("--stack-glow", "1")
      return
    }

    let frameId: number | null = null

    const update = () => {
      const rect = node.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height)
      const clamped = Math.min(1, Math.max(0, progress))
      const stretch = 0.94 + clamped * 0.12
      const glow = 0.7 + clamped * 0.4

      node.style.setProperty("--stack-stretch", stretch.toFixed(3))
      node.style.setProperty("--stack-glow", glow.toFixed(3))
    }

    const onScroll = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(() => {
        frameId = null
        update()
      })
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div
      ref={setRefs}
      className={`stacked-layers stacked-layers--image ${inView ? "is-visible" : ""} ${className}`}
    >
      <div className="stacked-layers-figure">
        <Image
          src="/donna-what-is-stack.png"
          alt="Stacked operational layers with DONNA highlighted"
          width={840}
          height={1260}
          className="stacked-layers-image"
          priority
        />
      </div>
    </div>
  )
}
