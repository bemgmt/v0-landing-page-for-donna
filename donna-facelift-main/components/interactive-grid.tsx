"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDashboardConfigOptional } from "@/contexts/DashboardConfigContext"
import { ArrowLeft, Mail, MessageCircle, BarChart3, Users, ClipboardList } from "lucide-react"
import dynamic from "next/dynamic"
import { useInvestorPreviewOptional } from "@/contexts/InvestorPreviewContext"
import { InvestorReadonlyShell } from "@/components/investor/investor-readonly-shell"

const HybridEmailInterface = dynamic(
  () => import("./interfaces/hybrid-email-interface"),
  { ssr: false, loading: () => <div className="p-6 text-white/60">Loading Gmail…</div> }
)

const AnalyticsInterface = dynamic(
  () => import("./interfaces/analytics-interface"),
  { ssr: false, loading: () => <div className="p-6 text-white/60">Loading Analytics…</div> }
)

const SalesInterface = dynamic(
  () => import("./interfaces/sales-interface"),
  { ssr: false, loading: () => <div className="p-6 text-white/60">Loading Sales…</div> }
)

const SecretaryInterface = dynamic(
  () => import("./interfaces/secretary-interface"),
  { ssr: false, loading: () => <div className="p-6 text-white/60">Loading Secretary…</div> }
)

const LeadGeneratorInterface = dynamic(
  () => import("./interfaces/lead-generator-interface"),
  { ssr: false, loading: () => <div className="p-6 text-white/60">Loading Lead Generator…</div> }
)

import ChatbotControlInterface from "./interfaces/chatbot-control-interface"

type GridItem = {
  id: string
  title: string
  icon: React.ReactNode
  component: React.ReactNode
  preview: React.ReactNode
}

const gridItems: GridItem[] = [
  {
    id: "sales",
    title: "sales dashboard",
    icon: <Users className="w-8 h-8" />,
    component: <SalesInterface />,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded">
        <div className="space-y-2">
          <div className="h-2 bg-blue-400/30 rounded w-3/4"></div>
          <div className="h-2 bg-blue-400/20 rounded w-1/2"></div>
          <div className="h-2 bg-blue-400/20 rounded w-2/3"></div>
          <div className="mt-4 space-y-1">
            <div className="h-1 bg-white/20 rounded w-full"></div>
            <div className="h-1 bg-white/15 rounded w-4/5"></div>
            <div className="h-1 bg-white/15 rounded w-3/5"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "email",
    title: "marketing",
    icon: <Mail className="w-8 h-8" />,
    component: <HybridEmailInterface />,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded">
        <div className="space-y-2">
          <div className="h-2 bg-purple-400/30 rounded w-3/4"></div>
          <div className="h-2 bg-purple-400/20 rounded w-1/2"></div>
          <div className="h-2 bg-purple-400/20 rounded w-2/3"></div>
          <div className="mt-4 space-y-1">
            <div className="h-1 bg-white/20 rounded w-full"></div>
            <div className="h-1 bg-white/15 rounded w-4/5"></div>
            <div className="h-1 bg-white/15 rounded w-3/5"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "chatbot",
    title: "chatbot control",
    icon: <MessageCircle className="w-8 h-8" />,
    component: <ChatbotControlInterface />,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded">
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="h-2 bg-green-400/40 rounded-full w-1/2"></div>
          </div>
          <div className="flex justify-start">
            <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
          </div>
          <div className="flex justify-end">
            <div className="h-2 bg-green-400/40 rounded-full w-1/3"></div>
          </div>
          <div className="flex justify-start">
            <div className="h-2 bg-white/30 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "lead-generator",
    title: "lead generator",
    icon: <Users className="w-8 h-8" />,
    component: <LeadGeneratorInterface />,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded">
        <div className="space-y-2">
          <div className="h-3 bg-green-400/40 rounded w-full"></div>
          <div className="h-1 bg-white/20 rounded w-4/5"></div>
          <div className="h-1 bg-white/15 rounded w-3/5"></div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "secretary",
    title: "secretary",
    icon: <ClipboardList className="w-8 h-8" />,
    component: <SecretaryInterface />,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-4 rounded flex items-center justify-center">
        <div className="space-y-2 w-full">
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-orange-400/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-orange-400/60"></div>
            </div>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-1 h-4 bg-orange-400/40 rounded animate-pulse"></div>
            <div className="w-1 h-6 bg-orange-400/50 rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-1 h-3 bg-orange-400/30 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-1 h-5 bg-orange-400/45 rounded animate-pulse" style={{ animationDelay: "0.3s" }}></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "analytics",
    title: "analytics",
    icon: <BarChart3 className="w-8 h-8" />,
    component: <AnalyticsInterface />,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-4 rounded">
        <div className="space-y-3">
          <div className="flex justify-between items-end space-x-1">
            <div className="h-2 bg-white/30 rounded w-1/2"></div>
            <div className="w-6 h-3 bg-white/20 rounded-full"></div>
          </div>
          <div className="space-y-1">
            <div className="h-1 bg-white/20 rounded w-full"></div>
            <div className="h-1 bg-white/15 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function InteractiveGrid() {
  const investor = useInvestorPreviewOptional()
  const dashboardConfig = useDashboardConfigOptional()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const visibleGridItems = useMemo(() => {
    const visible = dashboardConfig?.config?.mainInterface?.visibleModules
    if (!visible || !Array.isArray(visible) || visible.length === 0) return gridItems
    const idSet = new Set(visible)
    const ordered = visible
      .map((id) => gridItems.find((g) => g.id === id))
      .filter((g): g is GridItem => !!g)
    const rest = gridItems.filter((g) => !idSet.has(g.id))
    return [...ordered, ...rest]
  }, [dashboardConfig?.config?.mainInterface?.visibleModules])
  const [zoomLevel, setZoomLevel] = useState(0) // 0 to 100, smooth continuous zoom
  const [zoomVelocity, setZoomVelocity] = useState(0)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 }) // Viewport coordinates
  const [isMounted, setIsMounted] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomThreshold = 85 // When to trigger transition to detail view
  const lastWheelTime = useRef(Date.now())

  // Ensure component is mounted on client-side to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({
        x: e.clientX,
        y: e.clientY,
      })
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (selectedItem) return

      e.preventDefault()

      if (hoveredItem) {
        const now = Date.now()
        const timeDelta = now - lastWheelTime.current
        lastWheelTime.current = now

        const baseIncrement = e.deltaY * 0.08
        const velocityMultiplier = Math.min(2, Math.max(0.5, 100 / timeDelta))
        const delta = baseIncrement * velocityMultiplier

        setZoomVelocity(delta)

        setZoomLevel((prev) => {
          const newZoom = Math.max(0, Math.min(100, prev + delta))

          if (newZoom >= zoomThreshold && prev < zoomThreshold) {
            setTimeout(() => setSelectedItem(hoveredItem), 200)
          }

          return newZoom
        })
      } else {
        setZoomLevel((prev) => Math.max(0, prev - 8))
      }
    }

    const gridElement = gridRef.current
    if (gridElement) {
      gridElement.addEventListener("wheel", handleWheel, { passive: false })
      return () => gridElement.removeEventListener("wheel", handleWheel)
    }
  }, [hoveredItem, selectedItem, zoomThreshold])

  useEffect(() => {
    if (Math.abs(zoomVelocity) > 0.1) {
      const timer = setTimeout(() => {
        setZoomVelocity((prev) => prev * 0.95)
      }, 16)
      return () => clearTimeout(timer)
    }
  }, [zoomVelocity])

  useEffect(() => {
    if (!hoveredItem) {
      const resetZoom = () => {
        setZoomLevel((prev) => {
          if (prev > 0) {
            const newZoom = Math.max(0, prev - prev * 0.15)
            if (newZoom > 0.1) {
              requestAnimationFrame(resetZoom)
            }
            return newZoom
          }
          return 0
        })
      }
      resetZoom()
    }
  }, [hoveredItem])

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId)
  }

  const handleBackToGrid = () => {
    setSelectedItem(null)
    setHoveredItem(null)
    setZoomLevel(0)
    setZoomVelocity(0)
  }

  if (selectedItem) {
    const item = visibleGridItems.find((item) => item.id === selectedItem)
    return (
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="min-h-screen text-white relative"
        >
          <button
            onClick={handleBackToGrid}
            className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-light">back to grid</span>
          </button>
          <InvestorReadonlyShell
            active={Boolean(investor?.isInvestorPreview && selectedItem !== "secretary")}
          >
            {item?.component}
          </InvestorReadonlyShell>
        </motion.div>
      </AnimatePresence>
    )
  }

  const zoomProgress = zoomLevel / 100
  const easeOutProgress = 1 - Math.pow(1 - zoomProgress, 3)

  const getGridTransformOrigin = () => {
    // Use cursor position as percentage of viewport
    if (typeof window === 'undefined') return '50% 50%'
    const x = (cursorPosition.x / window.innerWidth) * 100
    const y = (cursorPosition.y / window.innerHeight) * 100
    return `${x}% ${y}%`
  }

  const getCellTransformOrigin = () => {
    if (gridRef.current) {
      const gridRect = gridRef.current.getBoundingClientRect()
      const x = ((cursorPosition.x - gridRect.left) / gridRect.width) * 100
      const y = ((cursorPosition.y - gridRect.top) / gridRect.height) * 100
      return `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`
    }
    return "50% 50%"
  }

  // Prevent hydration errors by not rendering until mounted
  if (!isMounted) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-white flex flex-col overflow-hidden"
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
    >
      <header className="p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-light tracking-wide">dashboard</h1>
            <p className="text-sm text-white/60 mt-1">AI-powered business tools</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40 border border-white/20 px-2 py-1 rounded">interactive grid</div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          ref={gridRef}
          className="grid grid-cols-3 grid-rows-2 gap-1 w-full max-w-6xl aspect-[3/2]"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: getGridTransformOrigin(),
            transform: `scale(${1 + zoomProgress * 0.8}) translateZ(${zoomProgress * 120}px)`,
            transition: "transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {visibleGridItems.map((item) => {
            const isHovered = hoveredItem === item.id
            const itemZoomProgress = isHovered ? easeOutProgress : 0

            const contentScale = 0.1 + itemZoomProgress * 0.4
            const contentOpacity = Math.min(0.8, itemZoomProgress * 1.2)

            const gridCellScale = 1 + itemZoomProgress * 0.15
            const gridCellZ = itemZoomProgress * 25

            return (
              <motion.div
                key={item.id}
                data-tour={`${item.id}-interface`}
                  className={`
                  relative border border-white/20 cursor-pointer overflow-hidden
                  transition-all duration-150 ease-out
                  ${isHovered ? "glass border-white/40 z-10" : "glass-dark"}
                `}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => {
                  if (item.id === 'chatbot') {
                    window.dispatchEvent(new CustomEvent('donna:open'))
                    return
                  }
                  handleItemClick(item.id)
                }}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: getCellTransformOrigin(),
                  transform: `scale(${gridCellScale}) translateZ(${gridCellZ}px)`,
                  zIndex: isHovered ? 10 : 1,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none p-8"
                  style={{
                    transform: `scale(${contentScale}) translateZ(${itemZoomProgress * 10}px)`,
                    opacity: contentOpacity,
                    transformOrigin: getCellTransformOrigin(),
                  }}
                >
                  <div className="w-full h-full overflow-hidden rounded-sm glass p-4">
                    <div className="w-full h-full overflow-hidden">{item.preview}</div>
                  </div>
                </div>

                <div
                  className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center transition-opacity duration-150"
                  style={{
                    opacity: 1 - Math.max(0, (itemZoomProgress - 0.3) * 1.4),
                  }}
                >
                  <div className={`mb-4 transition-all duration-150 ${isHovered ? "text-white" : "text-white/60"}`}>
                    {item.icon}
                  </div>
                  <h2
                    className={`text-xl font-light tracking-wide transition-all duration-150 ${
                      isHovered ? "text-white" : "text-white/80"
                    }`}
                  >
                    {item.title}
                  </h2>
                </div>

                <div
                  className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none transition-opacity duration-150"
                  style={{
                    opacity: isHovered ? itemZoomProgress * 0.2 + 0.05 : 0,
                  }}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-8">
        <div className="text-xs text-white/40 glass border border-white/20 px-2 py-1 rounded">
          hover + scroll to zoom {zoomLevel > 0 && `(${Math.round(zoomLevel)}%)`}
        </div>
      </div>
      <div className="absolute bottom-8 right-8">
        <div className="text-xs text-white/40 glass border border-white/20 px-2 py-1 rounded">click to enter</div>
      </div>
    </div>
  )
}
