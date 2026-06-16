"use client"

import { useEffect, useState } from "react"

interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * NoSSR component prevents server-side rendering of its children
 * This is useful for components that have client-side only features
 * like interactive grids, animations, or browser-specific APIs
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
