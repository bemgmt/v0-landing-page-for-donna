'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { startRealtimeSession } from '@/lib/realtime-webrtc'

// Dynamically import to handle missing package gracefully
let realtimeUtils: any = null
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore - dynamic import
    import('@openai/agents-realtime').then(module => {
      realtimeUtils = module.utils
    }).catch(() => {
      console.warn('@openai/agents-realtime not available')
    })
  } catch (e) {
    console.warn('@openai/agents-realtime not available:', e)
  }
}

export type RealtimeVoiceState = {
  connecting: boolean
  connected: boolean
  muted: boolean | null
  transcript: string
  error: string | null
}

export type RealtimeVoiceActions = {
  start: (opts?: { model?: string; instructions?: string; voice?: string }) => Promise<void>
  stop: () => void
  pushToTalkStart: () => void
  pushToTalkStop: () => void
  clearError: () => void
}

export function useRealtimeVoice(): [RealtimeVoiceState, RealtimeVoiceActions] {
  const sessionRef = useRef<import('@openai/agents-realtime').RealtimeSession | null>(null)
  const [state, setState] = useState<RealtimeVoiceState>({
    connecting: false,
    connected: false,
    muted: null,
    transcript: '',
    error: null,
  })

  const start = useCallback(async (opts?: { model?: string; instructions?: string; voice?: string }) => {
    if (state.connected || state.connecting) return
    setState(s => ({ ...s, connecting: true, error: null }))
    try {
      const { session } = await startRealtimeSession({
        model: opts?.model,
        instructions: opts?.instructions,
        voice: opts?.voice,
      })

      // Listen to session events
      session.on('transport_event', (evt: any) => {
        try {
          if (evt?.type === 'audio_transcript_delta' && evt.delta) {
            setState(s => ({ ...s, transcript: s.transcript + evt.delta }))
          }
          if (evt?.type === 'conversation.item.input_audio_transcription.completed' && evt.transcript) {
            // Fire and forget: POST to local events endpoint so other services can consume
            fetch('/api/voice/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ kind: 'user_transcript', transcript: evt.transcript, itemId: evt.item_id, at: Date.now() })
            }).catch(() => {})
          }
        } catch {}
      })

      session.on('history_added', (item: any) => {
        // Attempt to grab assistant text for logs when a response item is added
        try {
          const text = realtimeUtils?.getLastTextFromAudioOutputMessage?.(item as any)
          if (text) {
            fetch('/api/voice/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ kind: 'assistant_output', text, itemId: item?.id, at: Date.now() })
            }).catch(() => {})
          }
        } catch {}
      })

      sessionRef.current = session
      setState(s => ({ ...s, connecting: false, connected: true, muted: session.muted }))

      // Optional: start muted for PTT flow
      if (session.muted !== null) {
        session.mute(true)
        setState(s => ({ ...s, muted: true }))
      }
    } catch (err: any) {
      setState(s => ({ ...s, connecting: false, error: err?.message || 'Failed to start voice' }))
    }
  }, [state.connected, state.connecting])

  const stop = useCallback(() => {
    try {
      sessionRef.current?.close()
    } finally {
      sessionRef.current = null
      setState({ connecting: false, connected: false, muted: null, transcript: '', error: null })
    }
  }, [])

  const pushToTalkStart = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    try {
      if (session.muted !== null) session.mute(false)
      setState(s => ({ ...s, muted: session.muted }))
    } catch {}
  }, [])

  const pushToTalkStop = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    try {
      if (session.muted !== null) session.mute(true)
      setState(s => ({ ...s, muted: session.muted }))
    } catch {}
  }, [])

  const clearError = useCallback(() => setState(s => ({ ...s, error: null })), [])

  // Clean up on unmount
  useEffect(() => () => { sessionRef.current?.close(); sessionRef.current = null }, [])

  return [state, { start, stop, pushToTalkStart, pushToTalkStop, clearError }]
}

