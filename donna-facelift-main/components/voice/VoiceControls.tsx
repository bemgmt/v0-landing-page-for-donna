/* eslint-disable @typescript-eslint/no-explicit-any */
// Voice session requires flexible typing for WebRTC compatibility
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'
import { startRealtimeSession } from '@/lib/realtime-webrtc'

interface VoiceControlsProps {
  className?: string
}

type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

type RealtimeSession = {
  on?: (event: 'disconnected' | 'error', cb: (...args: any[]) => void) => void;
  off?: (event: 'disconnected' | 'error', cb: (...args: any[]) => void) => void;
  disconnect?: () => void | Promise<void>;
}

export default function VoiceControls({ className }: VoiceControlsProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('disconnected')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  // Session type is a dynamic WebRTC object—use a minimal interface for safety and flexibility
  const [session, setSession] = useState<RealtimeSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startSession = useCallback(async () => {
    try {
      setSessionStatus('connecting')
      setError(null)

      const { session: newSession } = await startRealtimeSession({
        instructions: process.env.NEXT_PUBLIC_REALTIME_INSTRUCTIONS || 'You are DONNA, a helpful AI assistant. Be professional, friendly, and concise.',
        voice: process.env.NEXT_PUBLIC_REALTIME_VOICE || 'alloy',
        model: process.env.NEXT_PUBLIC_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17'
      })

      setSession(newSession)
      setSessionStatus('connected')


    } catch (err) {
      console.error('Failed to start voice session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start voice session')
      setSessionStatus('error')
    }
  }, [])

  const endSession = useCallback(async () => {
    if (session) {
      try {
        await (session.disconnect?.() ?? Promise.resolve())
      } catch (err) {
        console.error('Error disconnecting session:', err)
      }
    }
    setSession(null)
    setSessionStatus('disconnected')
    setError(null)
    setIsMuted(false)
    setIsSpeakerMuted(false)
  }, [session])

  useEffect(() => {
    if (!session) return
    const s = session as RealtimeSession
    const onDisconnected = () => {
      setSession(null)
      setSessionStatus('disconnected')
    }
    const onError = (e: unknown) => {
      console.error('Voice session error:', e)
      setError(e instanceof Error ? e.message : 'Voice session error')
      setSessionStatus('error')
    }
    s.on?.('disconnected', onDisconnected)
    s.on?.('error', onError)
    return () => {
      s.off?.('disconnected', onDisconnected)
      s.off?.('error', onError)
    }
  }, [session])

  const toggleMute = useCallback(() => {
    if (session) {
      // Note: Actual mute implementation would depend on the WebRTC session API
      // This is a UI-only toggle for now
      setIsMuted((prev: boolean) => !prev)
    }
  }, [session])

  const toggleSpeaker = useCallback(() => {
    if (session) {
      // Note: Actual speaker mute implementation would depend on the WebRTC session API
      // This is a UI-only toggle for now
      setIsSpeakerMuted((prev: boolean) => !prev)
    }
  }, [session])

  const getStatusText = () => {
    switch (sessionStatus) {
      case 'connecting':
        return 'Connecting to voice session...'
      case 'connected':
        return 'Voice session active'
      case 'error':
        return 'Voice session error'
      default:
        return 'Voice session inactive'
    }
  }

  const getStatusColor = () => {
    switch (sessionStatus) {
      case 'connecting':
        return 'text-yellow-600'
      case 'connected':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Voice Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {error && (
            <div className="text-red-500 text-sm mt-1 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {sessionStatus !== 'connected' ? (
            <Button
              onClick={startSession}
              disabled={sessionStatus === 'connecting'}
              className="bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Start Call
            </Button>
          ) : (
            <Button
              onClick={endSession}
              disabled={sessionStatus === 'connecting'}
              variant="destructive"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          )}
        </div>

        {sessionStatus === 'connected' && (
          <div className="flex justify-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className={isMuted ? 'bg-red-50 text-red-600' : ''}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSpeaker}
              className={isSpeakerMuted ? 'bg-red-50 text-red-600' : ''}
            >
              {isSpeakerMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          {sessionStatus === 'disconnected' && 'Click "Start Call" to begin voice conversation'}
          {sessionStatus === 'connecting' && 'Establishing connection...'}
          {sessionStatus === 'connected' && 'Speak naturally - DONNA is listening'}
          {sessionStatus === 'error' && 'Please try again or check your connection'}
        </div>
      </CardContent>
    </Card>
  )
}
