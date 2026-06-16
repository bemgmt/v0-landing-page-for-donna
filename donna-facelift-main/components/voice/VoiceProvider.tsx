'use client'

import React, { createContext, useContext } from 'react'
import { useRealtimeVoice } from '@/hooks/use-realtime-voice'

const VoiceContext = createContext<ReturnType<typeof useRealtimeVoice> | null>(null)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const voice = useRealtimeVoice()
  return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>
}

export function useVoice() {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}

