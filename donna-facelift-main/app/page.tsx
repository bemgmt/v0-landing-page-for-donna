"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import NoSSR from "@/components/no-ssr"
import GridLoading from "@/components/grid-loading"
import ServiceStatus from "@/components/ServiceStatus"
import DonnaContextInitializer from "@/components/donna-context-initializer"

// Dynamically import the InteractiveGrid with no SSR
const InteractiveGrid = dynamic(
  () => import("@/components/interactive-grid"),
  {
    ssr: false,
    loading: () => <GridLoading />
  }
)

type FlowState = 'loading' | 'initializing' | 'checking-auth' | 'authenticated' | 'unauthenticated'

export default function Home() {
  const router = useRouter()
  const [flowState, setFlowState] = useState<FlowState>('loading')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuthentication = useCallback(() => {
    // After initialization, always redirect to login
    // This ensures the flow is: Loading → Initialize → Login → Grid
    // The login page will handle redirecting to home if already authenticated
    setIsAuthenticated(false)
    setFlowState('unauthenticated')
    router.push('/sign-in')
  }, [router])

  useEffect(() => {
    // Check if initialization has already been completed in this session
    const isInitialized = typeof window !== 'undefined' 
      ? sessionStorage.getItem('donna_context_initialized')
      : null
    const demoSession = typeof window !== 'undefined'
      ? localStorage.getItem('donna_demo_session')
      : null
    
    // Always check authentication, even in preview mode
    // Only show grid if both initialized AND authenticated
    if (isInitialized === 'true' && demoSession === 'true') {
      // Both initialization and auth are complete, show the grid
      // This handles the case when user returns from login page
      setIsAuthenticated(true)
      setFlowState('authenticated')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('donna:auth-ready'))
      }
    } else if (isInitialized === 'true') {
      // Initialization done but not authenticated, go to login
      setFlowState('checking-auth')
      checkAuthentication()
    } else {
      // Start with loading screen, then initialization
      const timer = setTimeout(() => {
        setFlowState('initializing')
      }, 500) // Brief loading screen before initialization

      return () => clearTimeout(timer)
    }
  }, [checkAuthentication])

  const handleInitializationComplete = useCallback(() => {
    // After initialization, check authentication
    setFlowState('checking-auth')
    checkAuthentication()
  }, [checkAuthentication])

  const handleInitializationError = useCallback((error: Error) => {
    console.error('DONNA Context initialization failed:', error)
    // Continue with auth check even if initialization fails
    handleInitializationComplete()
  }, [handleInitializationComplete])

  // Show loading screen initially
  if (flowState === 'loading') {
    return <GridLoading />
  }

  // Show initialization screen
  if (flowState === 'initializing') {
    return (
      <DonnaContextInitializer
        onComplete={handleInitializationComplete}
        onError={handleInitializationError}
      />
    )
  }

  // Show loading while checking authentication
  if (flowState === 'checking-auth') {
    return <GridLoading />
  }

  // If not authenticated, the redirect will happen, but show loading as fallback
  if (flowState === 'unauthenticated' || !isAuthenticated) {
    return <GridLoading />
  }

  // User is authenticated, show the interface
  return (
    <main className="min-h-screen">
      <div className="p-4 flex justify-end">
        <ServiceStatus />
      </div>
      <NoSSR fallback={<GridLoading />}>
        <InteractiveGrid />
      </NoSSR>
    </main>
  )
}
