"use client"

import { useState, useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || ''

export interface TelnyxCallState {
  isCalling: boolean
  currentCallId: string | null
  callStatus: 'idle' | 'ringing' | 'answered' | 'ended' | 'error'
  error: string | null
}

export interface TelnyxCallActions {
  initiateCall: (to: string, from?: string, options?: Record<string, unknown>) => Promise<{ success: boolean; call_id?: string; error?: string }>
  answerCall: (callId: string) => Promise<{ success: boolean; error?: string }>
  hangupCall: (callId: string) => Promise<{ success: boolean; error?: string }>
  transferCall: (callId: string, to: string) => Promise<{ success: boolean; error?: string }>
  getCallStatus: (callId: string) => Promise<{ status: string; call_id: string; data?: unknown }>
  recordCall: (callId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>
}

export function useTelnyxCalls(): [TelnyxCallState, TelnyxCallActions] {
  const [state, setState] = useState<TelnyxCallState>({
    isCalling: false,
    currentCallId: null,
    callStatus: 'idle',
    error: null
  })

  const initiateCall = useCallback(async (to: string, from?: string, options?: Record<string, unknown>) => {
    setState(prev => ({ ...prev, isCalling: true, error: null, callStatus: 'ringing' }))
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate_call',
          to,
          from,
          options
        })
      })

      const result = await response.json()

      if (result.success && result.call_id) {
        setState(prev => ({
          ...prev,
          isCalling: false,
          currentCallId: result.call_id,
          callStatus: 'ringing'
        }))
        return { success: true, call_id: result.call_id }
      } else {
        setState(prev => ({
          ...prev,
          isCalling: false,
          callStatus: 'error',
          error: result.error || 'Call initiation failed'
        }))
        return { success: false, error: result.error || 'Call initiation failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        isCalling: false,
        callStatus: 'error',
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  const answerCall = useCallback(async (callId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'answer_call',
          call_id: callId
        })
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          currentCallId: callId,
          callStatus: 'answered'
        }))
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }, [])

  const hangupCall = useCallback(async (callId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'hangup_call',
          call_id: callId
        })
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          currentCallId: null,
          callStatus: 'ended',
          isCalling: false
        }))
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }, [])

  const transferCall = useCallback(async (callId: string, to: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transfer_call',
          call_id: callId,
          to
        })
      })

      return await response.json()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }, [])

  const getCallStatus = useCallback(async (callId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_call_status',
          call_id: callId
        })
      })

      const result = await response.json()
      
      if (result.status) {
        setState(prev => ({
          ...prev,
          callStatus: result.status === 'answered' ? 'answered' : 
                     result.status === 'ended' ? 'ended' : 
                     result.status === 'ringing' ? 'ringing' : 'idle'
        }))
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { status: 'error', call_id: callId, error: errorMessage }
    }
  }, [])

  const recordCall = useCallback(async (callId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_call',
          call_id: callId,
          enabled
        })
      })

      return await response.json()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }, [])

  return [
    state,
    {
      initiateCall,
      answerCall,
      hangupCall,
      transferCall,
      getCallStatus,
      recordCall
    }
  ]
}
