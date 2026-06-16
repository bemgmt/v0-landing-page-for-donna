'use client'

import React from 'react'
import { useVoice } from './VoiceProvider'
import { Mic, MicOff, Phone, StopCircle } from 'lucide-react'

export default function VoicePanel() {
  const [state, actions] = useVoice()

  return (
    <div className="donna-glass donna-gradient-border rounded-xl p-4">
      <div className="text-sm text-white/80 mb-2">Voice (Realtime WebRTC)</div>
      {state.error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 mb-2">
          {state.error}
          <button onClick={actions.clearError} className="ml-2 underline">dismiss</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        {!state.connected ? (
          <button
            className="px-3 py-2 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-sm"
            onClick={() => actions.start()}
            disabled={state.connecting}
            title="Start voice (requires user gesture)"
          >
            <Phone className="w-4 h-4 inline mr-1"/>{state.connecting? 'Connecting…':'Start Voice'}
          </button>
        ) : (
          <>
            <button
              className="px-3 py-2 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-sm"
              onClick={actions.stop}
            >
              <StopCircle className="w-4 h-4 inline mr-1"/>Stop
            </button>
            <button
              className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
              onMouseDown={actions.pushToTalkStart}
              onMouseUp={actions.pushToTalkStop}
              onTouchStart={actions.pushToTalkStart}
              onTouchEnd={actions.pushToTalkStop}
              title="Hold to speak"
            >
              {state.muted ? <MicOff className="w-4 h-4 inline mr-1"/> : <Mic className="w-4 h-4 inline mr-1"/>}
              {state.muted ? 'Hold to Talk' : 'Release to Mute'}
            </button>
          </>
        )}
      </div>
      <div className="text-xs text-white/60 mt-3">
        <div className="opacity-70 mb-1">Transcript</div>
        <div className="min-h-[64px] whitespace-pre-wrap leading-relaxed">{state.transcript || '—'}</div>
      </div>
    </div>
  )
}

