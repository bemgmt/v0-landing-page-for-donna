"use client"

import { useContext } from 'react'
import { TourTrigger } from './TourTrigger'
import { TourContext } from '@/contexts/TourContext'
import dynamic from 'next/dynamic'

// Dynamically import TourOverlay to avoid circular dependency
const TourOverlay = dynamic(
  () => import('./TourOverlay').then(mod => ({ default: mod.TourOverlay })),
  { ssr: false }
)

/**
 * Client wrapper for the tour system
 * Renders tour trigger and overlay components
 */
export default function TourSystem() {
  // Use useContext directly to check if tour is active
  const context = useContext(TourContext)
  const isActive = context?.isActive && context?.activeTour && context?.currentStep

  return (
    <>
      <TourTrigger />
      {isActive && <TourOverlay />}
    </>
  )
}

