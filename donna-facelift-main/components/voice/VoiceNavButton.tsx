'use client'

import React from 'react'
import { useVoice } from './VoiceProvider'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceNavButton() {
  const [state, actions] = useVoice()
  const label = state.connected ? 'Stop voice' : 'Start voice'

  return (
    <button
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
      onClick={() => (state.connected ? actions.stop() : actions.start())}
      title={label}
    >
      {state.connected ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

