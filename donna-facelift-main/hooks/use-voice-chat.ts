import { useState, useCallback, useRef, useMemo } from 'react'
import { useAudioRecorder } from './use-audio-recorder'
import { useAudioPlayer } from './use-audio-player'
// Note: In production, import DonnaOpenAIClient for direct client-side processing

export interface VoiceChatMessage {
  id: string
  type: 'user' | 'assistant'
  text: string
  audioUrl?: string
  timestamp: Date
}

export interface VoiceChatState {
  messages: VoiceChatMessage[]
  isProcessing: boolean
  currentVoiceId: string
  availableVoices: any[]
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  error: string | null
}

export interface VoiceChatActions {
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>
  sendTextMessage: (text: string) => Promise<void>
  setVoiceId: (voiceId: string) => void
  testConnection: () => Promise<void>
  loadVoices: () => Promise<void>
  clearMessages: () => void
  clearError: () => void
}

export interface UseVoiceChatOptions {
  apiBaseUrl?: string
  userId?: string
  defaultVoiceId?: string
  mode?: 'batch' | 'realtime' // New: specify processing mode
  onMessage?: (message: VoiceChatMessage) => void
  onError?: (error: string) => void
}

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const {
    apiBaseUrl = '',
    userId = 'voice-user',
    defaultVoiceId = 'XcXEQzuLXRU9RcfWzEJt', // Your custom ElevenLabs voice
    mode = 'batch', // Default to batch processing
    onMessage,
    onError
  } = options

  const [state, setState] = useState<VoiceChatState>({
    messages: [],
    isProcessing: false,
    currentVoiceId: defaultVoiceId,
    availableVoices: [],
    connectionStatus: 'disconnected',
    error: null
  })

  const messageIdCounter = useRef(0)

  // Audio recorder for capturing user voice
  const [recorderState, recorderActions] = useAudioRecorder({
    enableVAD: true,
    vadThreshold: 0.01,
    onError: (error) => {
      setState(prev => ({ ...prev, error }))
      onError?.(error)
    }
  })

  // Audio player for playing assistant responses
  const [playerState, playerActions] = useAudioPlayer({
    onError: (error) => {
      setState(prev => ({ ...prev, error }))
      onError?.(error)
    }
  })

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${++messageIdCounter.current}`
  }, [])

  // Add message to chat
  const addMessage = useCallback((message: Omit<VoiceChatMessage, 'id'>) => {
    const fullMessage: VoiceChatMessage = {
      ...message,
      id: generateMessageId()
    }
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, fullMessage]
    }))
    
    onMessage?.(fullMessage)
    return fullMessage
  }, [generateMessageId, onMessage])

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      // Convert audio blob to base64
      const audioBase64 = await blobToBase64(audioBlob)

      // Send to voice chat API
      const response = await fetch(`${apiBaseUrl}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'speech_to_speech',
          audio_data: audioBase64.split(',')[1], // Remove data URL prefix
          voice_id: state.currentVoiceId,
          user_id: userId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Voice processing failed')
      }

      // Add user message (transcription)
      addMessage({
        type: 'user',
        text: result.transcription,
        timestamp: new Date()
      })

      // Add assistant message
      const assistantMessage = addMessage({
        type: 'assistant',
        text: result.response_text,
        timestamp: new Date()
      })

      // Play the audio response
      if (result.response_audio) {
        await playerActions.play(result.response_audio)
      }

      setState(prev => ({ ...prev, isProcessing: false }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice processing failed'
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: errorMessage
      }))
      onError?.(errorMessage)
    }
  }, [apiBaseUrl, state.currentVoiceId, userId, addMessage, playerActions, onError])

  // Send text message (with voice response)
  const sendTextMessage = useCallback(async (text: string) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      const historyForApi = [
        ...state.messages.map((m) => ({
          role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user' as const, content: text },
      ]

      addMessage({
        type: 'user',
        text,
        timestamp: new Date()
      })

      const response = await fetch('/api/knowledge-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ messages: historyForApi }),
      })

      const result = (await response.json()) as {
        success?: boolean
        reply?: string
        error?: string
      }

      if (!response.ok || !result.success || !result.reply) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Message processing failed'
        )
      }

      const voiceResponse = await fetch(`${apiBaseUrl}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'text_to_speech',
          text: result.reply,
          voice_id: state.currentVoiceId,
        }),
      })

      let audioData = null
      if (voiceResponse.ok) {
        const voiceResult = await voiceResponse.json()
        if (voiceResult.success) {
          audioData = voiceResult.audio_data
        }
      }

      addMessage({
        type: 'assistant',
        text: result.reply,
        timestamp: new Date(),
      })

      if (audioData) {
        await playerActions.play(audioData)
      }

      setState(prev => ({ ...prev, isProcessing: false }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Message processing failed'
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: errorMessage
      }))
      onError?.(errorMessage)
    }
  }, [apiBaseUrl, state.messages, state.currentVoiceId, addMessage, playerActions, onError])

  // Set voice ID
  const setVoiceId = useCallback((voiceId: string) => {
    setState(prev => ({ ...prev, currentVoiceId: voiceId }))
  }, [])

  // Test API connection
  const testConnection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting', error: null }))

      const response = await fetch(`${apiBaseUrl}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error('Connection test failed')
      }

      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'connected'
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed'
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        error: errorMessage
      }))
      onError?.(errorMessage)
    }
  }, [apiBaseUrl, onError])

  // Load available voices
  const loadVoices = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/voice-chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_voices'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          availableVoices: result.voices?.voices || []
        }))
      }

    } catch (error) {
      console.warn('Failed to load voices:', error)
      // Don't set error state for voice loading failure
    }
  }, [apiBaseUrl])

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const actions = useMemo<VoiceChatActions>(() => ({
    sendVoiceMessage,
    sendTextMessage,
    setVoiceId,
    testConnection,
    loadVoices,
    clearMessages,
    clearError
  }), [sendVoiceMessage, sendTextMessage, setVoiceId, testConnection, loadVoices, clearMessages, clearError])

  // Combined state including recorder and player states
  const combinedState = {
    ...state,
    recorder: recorderState,
    player: playerState
  }

  const combinedActions = useMemo(() => ({
    ...actions,
    recorder: recorderActions,
    player: playerActions
  }), [actions, recorderActions, playerActions])

  return [combinedState, combinedActions] as const
}

// Helper function to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
