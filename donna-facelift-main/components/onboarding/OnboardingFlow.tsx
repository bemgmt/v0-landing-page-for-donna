"use client"

import React, { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useTour } from '@/contexts/TourContext'
import { WelcomeStep } from './WelcomeStep'
import { PersonalityStep } from './PersonalityStep'
import { TourStep } from './TourStep'
import { TourOverlay } from '../tour/TourOverlay'

export function OnboardingFlow() {
  const { state, loadProgress } = useOnboarding()
  const { isActive: isTourActive } = useTour()

  // Load saved progress on mount
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Don't show onboarding if already complete
  if (state.isComplete) {
    return null
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {state.currentStep === 'welcome' && (
          <WelcomeStep key="welcome" />
        )}
        {(state.currentStep === 'profile' || state.currentStep === 'personality') && (
          <PersonalityStep key="personality" />
        )}
        {state.currentStep === 'tour' && (
          <TourStep key="tour" />
        )}
      </AnimatePresence>

      {/* Tour overlay - shown when tour is active */}
      {isTourActive && <TourOverlay />}
    </>
  )
}

