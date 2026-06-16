"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { TourConfig, TourStep } from '@/types/onboarding'

interface TourContextType {
  activeTour: TourConfig | null
  currentStep: TourStep | null
  currentStepIndex: number
  isActive: boolean
  startTour: (config: TourConfig) => void | Promise<void>
  nextStep: () => void | Promise<void>
  previousStep: () => void | Promise<void>
  goToStep: (index: number) => void | Promise<void>
  pauseTour: () => void
  resumeTour: () => void
  endTour: () => void
  skipTour: () => void
}

export const TourContext = createContext<TourContextType | null>(null)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentStep = activeTour?.steps[currentStepIndex] || null
  const isActive = activeTour !== null && !isPaused

  // Load persisted tour state on mount
  useEffect(() => {
    const savedTourState = localStorage.getItem('donna_tour_state')
    if (savedTourState) {
      try {
        const state = JSON.parse(savedTourState)
        if (state.tourId && state.stepIndex !== undefined && state.isPaused) {
          // Tour was paused - we'll need to reload the tour config
          // This will be handled by components that have access to tour configs
          window.dispatchEvent(new CustomEvent('donna:tour-resume-requested', {
            detail: { tourId: state.tourId, stepIndex: state.stepIndex }
          }))
        }
      } catch (e) {
        console.error('Failed to load tour state:', e)
      }
    }
  }, [])

  // Persist tour state
  useEffect(() => {
    if (activeTour) {
      const state = {
        tourId: activeTour.id,
        stepIndex: currentStepIndex,
        isPaused,
        timestamp: Date.now()
      }
      localStorage.setItem('donna_tour_state', JSON.stringify(state))
    } else {
      localStorage.removeItem('donna_tour_state')
    }
  }, [activeTour, currentStepIndex, isPaused])

  const startTour = useCallback(async (config: TourConfig) => {
    // Execute beforeShow for first step (await if it returns a Promise)
    if (config.steps[0]?.beforeShow) {
      await Promise.resolve(config.steps[0].beforeShow())
    }
    setActiveTour(config)
    setCurrentStepIndex(0)
    setIsPaused(false)
    // Emit step change event for first step
    if (config.steps[0]?.chatMessage) {
      window.dispatchEvent(new CustomEvent('donna:tour-step-changed', {
        detail: {
          stepId: config.steps[0].id,
          chatMessage: config.steps[0].chatMessage,
          stepIndex: 0
        }
      }))
    }
  }, [])

  const nextStep = useCallback(async () => {
    if (!activeTour) return

    const nextIndex = currentStepIndex + 1
    // Execute afterShow for current step (await if it returns a Promise)
    if (currentStep?.afterShow) {
      await Promise.resolve(currentStep.afterShow())
    }

    if (nextIndex >= activeTour.steps.length) {
      activeTour.onComplete?.()
      setActiveTour(null)
      setCurrentStepIndex(0)
    } else {
      // Execute beforeShow for next step (await if it returns a Promise)
      if (activeTour.steps[nextIndex]?.beforeShow) {
        await Promise.resolve(activeTour.steps[nextIndex].beforeShow!())
      }
      setCurrentStepIndex(nextIndex)
      if (activeTour.steps[nextIndex]?.chatMessage) {
        window.dispatchEvent(new CustomEvent('donna:tour-step-changed', {
          detail: {
            stepId: activeTour.steps[nextIndex].id,
            chatMessage: activeTour.steps[nextIndex].chatMessage,
            stepIndex: nextIndex
          }
        }))
      }
    }
  }, [activeTour, currentStepIndex, currentStep])

  const previousStep = useCallback(async () => {
    if (!activeTour || currentStepIndex === 0) return

    const prevIndex = currentStepIndex - 1
    if (activeTour.steps[prevIndex]?.beforeShow) {
      await Promise.resolve(activeTour.steps[prevIndex].beforeShow!())
    }
    setCurrentStepIndex(prevIndex)
    if (activeTour.steps[prevIndex]?.chatMessage) {
      window.dispatchEvent(new CustomEvent('donna:tour-step-changed', {
        detail: {
          stepId: activeTour.steps[prevIndex].id,
          chatMessage: activeTour.steps[prevIndex].chatMessage,
          stepIndex: prevIndex
        }
      }))
    }
  }, [activeTour, currentStepIndex])

  const goToStep = useCallback(async (index: number) => {
    if (!activeTour || index < 0 || index >= activeTour.steps.length) return
    if (activeTour.steps[index]?.beforeShow) {
      await Promise.resolve(activeTour.steps[index].beforeShow!())
    }
    setCurrentStepIndex(index)
    if (activeTour.steps[index]?.chatMessage) {
      window.dispatchEvent(new CustomEvent('donna:tour-step-changed', {
        detail: {
          stepId: activeTour.steps[index].id,
          chatMessage: activeTour.steps[index].chatMessage,
          stepIndex: index
        }
      }))
    }
  }, [activeTour])

  const pauseTour = useCallback(() => {
    setIsPaused(true)
    // Persist paused state
    if (activeTour) {
      const state = {
        tourId: activeTour.id,
        stepIndex: currentStepIndex,
        isPaused: true,
        timestamp: Date.now()
      }
      localStorage.setItem('donna_tour_state', JSON.stringify(state))
    }
  }, [activeTour, currentStepIndex])

  const resumeTour = useCallback(() => {
    setIsPaused(false)
    // Update persisted state
    if (activeTour) {
      const state = {
        tourId: activeTour.id,
        stepIndex: currentStepIndex,
        isPaused: false,
        timestamp: Date.now()
      }
      localStorage.setItem('donna_tour_state', JSON.stringify(state))
    }
  }, [activeTour, currentStepIndex])

  const endTour = useCallback(() => {
    if (activeTour?.onComplete) {
      activeTour.onComplete()
    }
    setActiveTour(null)
    setCurrentStepIndex(0)
    setIsPaused(false)
  }, [activeTour])

  const skipTour = useCallback(() => {
    if (activeTour?.onSkip) {
      activeTour.onSkip()
    }
    setActiveTour(null)
    setCurrentStepIndex(0)
    setIsPaused(false)
  }, [activeTour])

  // Listen for tour events from DONNA chat
  useEffect(() => {
    const handleTourEvent = (event: CustomEvent) => {
      const { action, tourId } = event.detail
      
      if (action === 'start' && tourId) {
        // Tour will be started by the component that has the tour config
        window.dispatchEvent(new CustomEvent('donna:tour-requested', { detail: { tourId } }))
      } else if (action === 'pause') {
        pauseTour()
      } else if (action === 'resume') {
        resumeTour()
      } else if (action === 'skip') {
        skipTour()
      }
    }

    window.addEventListener('donna:tour-control', handleTourEvent as EventListener)
    return () => {
      window.removeEventListener('donna:tour-control', handleTourEvent as EventListener)
    }
  }, [pauseTour, resumeTour, skipTour])

  const value: TourContextType = {
    activeTour,
    currentStep,
    currentStepIndex,
    isActive,
    startTour,
    nextStep,
    previousStep,
    goToStep,
    pauseTour,
    resumeTour,
    endTour,
    skipTour
  }

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within TourProvider')
  }
  return context
}

