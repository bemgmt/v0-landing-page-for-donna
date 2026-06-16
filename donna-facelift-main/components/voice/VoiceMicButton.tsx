'use client'

import React from 'react'
import { useVoice } from './VoiceProvider'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceMicButton() {
  const [state, actions] = useVoice()

  return (
    <button
      className="fixed bottom-4 right-4 z-50 rounded-full p-3 bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur"
      onClick={() => {
        if (!state.connected) actions.start()
        else actions.stop()
      }}
      title={state.connected ? 'Stop voice' : 'Start voice'}
    >
      {state.connected ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
    </button>
  )
}

