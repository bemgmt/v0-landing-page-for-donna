"use client"

import { useEffect, useState } from "react"

export default function DonnaLightBar() {
  const [isActive, setIsActive] = useState(false)
  const [intensity, setIntensity] = useState(0.75)

  useEffect(() => {
    // Listen for Donna speaking events
    const handleDonnaSpeaking = (e: Event) => {
      const customEvent = e as CustomEvent
      setIsActive(customEvent.detail?.speaking ?? false)
      if (customEvent.detail?.intensity !== undefined) {
        setIntensity(customEvent.detail.intensity)
      }
    }

    const handleDonnaStart = () => setIsActive(true)
    const handleDonnaStop = () => setIsActive(false)

    window.addEventListener('donna:speaking', handleDonnaSpeaking)
    window.addEventListener('donna:start-speaking', handleDonnaStart)
    window.addEventListener('donna:stop-speaking', handleDonnaStop)

    return () => {
      window.removeEventListener('donna:speaking', handleDonnaSpeaking)
      window.removeEventListener('donna:start-speaking', handleDonnaStart)
      window.removeEventListener('donna:stop-speaking', handleDonnaStop)
    }
  }, [])

  return (
    <div 
      className={`donna-light-bar ${isActive ? 'donna-light-bar-active' : ''}`}
      style={{
        opacity: isActive ? intensity : 0.75,
        transition: 'opacity 0.3s ease'
      }}
    />
  )
}

