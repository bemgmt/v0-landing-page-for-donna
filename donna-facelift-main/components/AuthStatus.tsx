"use client"

import { useEffect, useState } from 'react'

export function AuthStatus() {
  const [hasDemoSession, setHasDemoSession] = useState(false)

  useEffect(() => {
    // Check for demo session in localStorage (client-side)
    const demoSession = localStorage.getItem('donna_demo_session')
    setHasDemoSession(demoSession === 'true')
  }, [])

  // Don't show "Auth disabled in preview" if user has demo session
  if (hasDemoSession) {
    return null
  }

  return <span>Auth disabled in preview</span>
}

