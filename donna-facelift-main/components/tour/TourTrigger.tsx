"use client"

import { useEffect, useContext } from 'react'
import { TourContext } from '@/contexts/TourContext'
import { toast } from '@/hooks/use-toast'
import type { TourConfig } from '@/types/onboarding'

/**
 * Minimal inline tour config to avoid circular dependency
 * This is used as a fallback when the full module can't be loaded
 */
const createMinimalDashboardTour = (): TourConfig => ({
  id: 'dashboard-full-tour',
  type: 'full',
  title: 'Welcome to Your DONNA Dashboard',
  description: 'Let me show you around your new AI-powered workspace',
  canSkip: true,
  canPause: true,
  autoStart: false,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome to DONNA! 🎉',
      description: 'I\'m excited to show you around! This tour will help you discover all the powerful features at your fingertips. You can pause or skip anytime.',
      placement: 'center'
    },
    {
      id: 'chat-widget',
      target: '[aria-label="Open DONNA Chat"]',
      title: 'Your AI Assistant',
      description: 'Click here anytime to chat with me! I can help with tasks, answer questions, and guide you through any feature. I\'m always here to help.',
      placement: 'left',
      highlightPadding: 12
    },
    {
      id: 'dashboard-grid',
      target: '.grid',
      title: 'Your Dashboard',
      description: 'This is your command center. Each card represents a different area of your business. Hover over any card to see a preview, then click to dive in.',
      placement: 'top',
      highlightPadding: 16
    },
    {
      id: 'complete',
      target: 'body',
      title: 'You\'re All Set! 🚀',
      description: 'That\'s the quick tour! Remember, you can always ask me for help or request a deeper tour of any section. Ready to get started?',
      placement: 'center'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_dashboard_tour_completed', 'true')
    window.dispatchEvent(new CustomEvent('donna:tour-complete', {
      detail: { tourId: 'dashboard-full-tour' }
    }))
  },
  onSkip: () => {
    localStorage.setItem('donna_dashboard_tour_skipped', 'true')
  }
})

/**
 * Component that listens for tour requests and starts the appropriate tour
 * This handles both chat-triggered tours and programmatic tour requests
 */
export function TourTrigger() {
  // Use useContext directly to avoid throwing errors if context is not available
  const context = useContext(TourContext)
  
  // If context is not available, set up listeners but they won't work until context is ready
  const startTour = context?.startTour

  useEffect(() => {
    // Set up listeners even if startTour is not available yet
    // They will work once the context is ready
    if (typeof window === 'undefined') {
      return
    }

    // Cache for loaded tour configs
    let tourConfigsCache: any = null
    let isLoading = false
    
    const loadTourConfigs = async (retryCount = 0): Promise<any> => {
      if (tourConfigsCache) {
        return tourConfigsCache
      }
      
      if (isLoading) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 100))
        return loadTourConfigs(retryCount)
      }
      
      // After 2 retries, use minimal inline config as fallback
      if (retryCount > 2) {
        console.warn('Using minimal inline tour config due to import issues')
        return {
          dashboardTour: createMinimalDashboardTour(),
          quickTips: null,
          allTours: {}
        }
      }
      
      isLoading = true
      
      try {
        // Use a longer delay to ensure modules are fully initialized
        await new Promise(resolve => setTimeout(resolve, 300 + retryCount * 200))
        
        // Try to import the tour module
        const tourModule = await import('@/lib/tours/dashboard-tour')
        
        // Wait a bit more to ensure module is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if the module exports are actually available
        if (!tourModule.dashboardTour) {
          throw new Error('Tour module exports not available')
        }
        
        tourConfigsCache = {
          dashboardTour: tourModule.dashboardTour,
          comprehensiveDashboardTour: tourModule.comprehensiveDashboardTour,
          quickTips: tourModule.quickTips,
          allTours: tourModule.allTours
        }
        
        isLoading = false
        return tourConfigsCache
      } catch (error) {
        isLoading = false
        console.warn('Failed to load tour configs, will retry or use fallback:', error)
        // Retry with exponential backoff
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 300 * (retryCount + 1)))
          return loadTourConfigs(retryCount + 1)
        }
        // Use minimal config as fallback
        return {
          dashboardTour: createMinimalDashboardTour(),
          quickTips: null,
          allTours: {}
        }
      }
    }

    // Listen for tour requests from chat or other sources
    const handleTourRequest = async (event: CustomEvent) => {
      try {
        if (!startTour) {
          // Context not ready yet, wait a bit and try again
          setTimeout(() => handleTourRequest(event), 100)
          return
        }

        // Load tour configs with retry mechanism
        const tourConfigs = await loadTourConfigs()
        
        if (!tourConfigs || !tourConfigs.dashboardTour) {
          console.warn('Tour configs not available')
          toast({
            title: 'Tour unavailable',
            description: 'The guided tour could not be loaded. Please try again later.',
            variant: 'destructive'
          })
          return
        }

        const { tourId } = event.detail
        
        // Find the tour config by ID from allTours object
        let tourConfig = null
        
        // Check allTours object first
        if (tourConfigs.allTours && typeof tourConfigs.allTours === 'object') {
          try {
            for (const [key, tour] of Object.entries(tourConfigs.allTours)) {
              if (tour && typeof tour === 'object' && 'id' in tour && tour.id === tourId) {
                tourConfig = tour
                break
              }
            }
          } catch (e) {
            console.warn('Error iterating allTours:', e)
          }
        }
        
        // Fallback to specific tours
        if (!tourConfig) {
          if (tourId === 'dashboard-full-tour' && tourConfigs.dashboardTour) {
            tourConfig = tourConfigs.dashboardTour
          } else if (tourId === 'comprehensive-dashboard-tour' && tourConfigs.comprehensiveDashboardTour) {
            tourConfig = tourConfigs.comprehensiveDashboardTour
          } else if (tourId === 'quick-tips' && tourConfigs.quickTips) {
            tourConfig = tourConfigs.quickTips
          }
        }
        
        if (tourConfig && startTour) {
          await startTour(tourConfig)
        } else if (startTour && tourConfigs.dashboardTour) {
          console.warn(`Tour not found: ${tourId}. Starting default dashboard tour.`)
          await startTour(tourConfigs.dashboardTour)
        }
      } catch (error) {
        console.error('Error handling tour request:', error)
        toast({
          title: 'Tour error',
          description: 'Something went wrong starting the tour. Please try again.',
          variant: 'destructive'
        })
      }
    }

    // Listen for tour control events (from chat)
    const handleTourControl = (event: CustomEvent) => {
      try {
        const { action, tourId } = event.detail
        
        if (action === 'start' && tourId) {
          handleTourRequest(event)
        }
      } catch (error) {
        console.error('Error handling tour control:', error)
      }
    }

    // Only add listeners if window is available (client-side)
    if (typeof window !== 'undefined') {
      window.addEventListener('donna:tour-requested', handleTourRequest as EventListener)
      window.addEventListener('donna:tour-control', handleTourControl as EventListener)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('donna:tour-requested', handleTourRequest as EventListener)
        window.removeEventListener('donna:tour-control', handleTourControl as EventListener)
      }
    }
  }, [startTour])

  // This component doesn't render anything
  return null
}

