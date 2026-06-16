import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { shouldRetry, getRetryDelay, isRetriableError } from '@/lib/reconnect-policy'
import { checkWebSocketHealth, type WebSocketHealthResponse } from '@/lib/websocket-health-check'

export interface RealtimeMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  audioData?: string
  timestamp: Date
}

export interface RealtimeState {
  isConnected: boolean
  isConnecting: boolean
  isListening: boolean
  isSpeaking: boolean
  messages: RealtimeMessage[]
  currentTranscript: string
  audioLevel: number
  error: string | null
  sessionId: string | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  isReconnecting: boolean
  nextReconnectDelay: number
  serverHealth: WebSocketHealthResponse | null
}

export interface RealtimeActions {
  connect: () => Promise<void>
  disconnect: () => void
  startListening: () => void
  stopListening: () => void
  sendAudio: (audioData: ArrayBuffer) => void
  sendText: (text: string) => void
  clearMessages: () => void
  clearError: () => void
  forceReconnect: () => void
  cancelReconnect: () => void
  resetReconnectAttempts: () => void
  checkServerHealth: () => Promise<void>
  /** Optional: toggle voice activity detection (UI helper) */
  setVadEnabled?: (enabled: boolean) => void
}

export interface UseOpenAIRealtimeOptions {
  websocketUrl?: string
  apiBaseUrl?: string // Deprecated: use websocketUrl instead
  instructions?: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  temperature?: number
  onMessage?: (message: RealtimeMessage) => void
  onError?: (error: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useOpenAIRealtime(options: UseOpenAIRealtimeOptions = {}) {
  const {
    websocketUrl = '',
    apiBaseUrl = '', // Fallback for backward compatibility
    instructions = 'You are DONNA, a helpful AI receptionist. Be professional, friendly, and concise.',
    voice = 'alloy',
    temperature = 0.8,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    isListening: false,
    isSpeaking: false,
    messages: [],
    currentTranscript: '',
    audioLevel: 0,
    error: null,
    sessionId: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    isReconnecting: false,
    nextReconnectDelay: 0,
    serverHealth: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const sessionRef = useRef<any | null>(null) // RealtimeSession for WebRTC path
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const messageIdCounter = useRef(0)
  const currentTranscriptRef = useRef<string>('')
  const isConnectedRef = useRef<boolean>(false)
  const isConnectingRef = useRef<boolean>(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef<boolean>(true)
  const connectFnRef = useRef<(() => Promise<void>) | null>(null)
  const useWsProxy = (process.env.NEXT_PUBLIC_USE_WS_PROXY || 'true') === 'true'

  const generateMessageId = useCallback(() => `msg_${Date.now()}_${++messageIdCounter.current}`, [])

  const addMessage = useCallback(
    (message: Omit<RealtimeMessage, 'id'>) => {
      const fullMessage: RealtimeMessage = { ...message, id: generateMessageId() }
      setState((prev) => ({ ...prev, messages: [...prev.messages, fullMessage] }))
      onMessage?.(fullMessage)

      // Persist message to DB via API route
      if (wsRef.current) { // only persist if there is a session
        fetch('/api/db/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: state.sessionId,
            message: {
              role: fullMessage.type,
              content: fullMessage.content,
            }
          }),
        }).catch(err => console.error('Failed to persist message:', err))
      }

      return fullMessage
    },
    [generateMessageId, onMessage, state.sessionId],
  )

  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse((event as any).data)

        switch (data.type) {
          case 'session.created':
          case 'session.updated':
            setState((prev) => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              sessionId: data.session?.id || prev.sessionId,
            }))
            onConnect?.()
            break

          case 'input_audio_buffer.speech_started':
            setState((prev) => ({ ...prev, isListening: true }))
            break

          case 'input_audio_buffer.speech_stopped':
            setState((prev) => ({ ...prev, isListening: false }))
            break

          case 'response.audio_transcript.delta':
          case 'response.output_text.delta':
            console.log('Received text delta:', data.delta)
            currentTranscriptRef.current += data.delta || ''
            setState((prev) => ({ ...prev, currentTranscript: currentTranscriptRef.current }))
            break

          case 'response.audio.delta':
            setState((prev) => ({ ...prev, isSpeaking: true }))
            break

          case 'response.done':
          case 'response.completed': {
            const finalTranscript = currentTranscriptRef.current
            console.log('Response completed, transcript:', finalTranscript)
            if (finalTranscript) {
              console.log('Adding assistant message to chat')
              addMessage({ type: 'assistant', content: finalTranscript, timestamp: new Date() })
            }
            currentTranscriptRef.current = ''
            setState((prev) => ({ ...prev, isSpeaking: false, currentTranscript: '' }))
            break
          }

          case 'conversation.item.created':
            if (data.item?.role === 'user' && data.item?.content?.[0]?.transcript) {
              addMessage({ type: 'user', content: data.item.content[0].transcript, timestamp: new Date() })
            }
            break

          case 'error': {
            const errorMessage = data.error?.message || 'Unknown error occurred'
            setState((prev) => ({ ...prev, error: errorMessage }))
            onError?.(errorMessage)
            break
          }

          default:
            console.log('Unhandled message type:', data.type, data)
        }
      } catch (error: any) {
        console.error('Error parsing WebSocket message:', error)
      }
    },
    [addMessage, onConnect, onError],
  )

  // Reconnection functions
  const cancelReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isReconnecting: false,
      nextReconnectDelay: 0
    }));
  }, []);

  const resetReconnectAttempts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
      isReconnecting: false,
      nextReconnectDelay: 0
    }));
  }, []);

  const scheduleReconnect = useCallback((error: any) => {
    setState((prev) => {
      const newAttempts = prev.reconnectAttempts + 1;

      // Check if we should retry
      if (!shouldRetry(error, newAttempts, prev.maxReconnectAttempts)) {
        console.log('[WebSocket] Max reconnection attempts reached or non-retriable error');
        return {
          ...prev,
          isReconnecting: false,
          isConnecting: false,
          error: `Connection failed after ${prev.maxReconnectAttempts} attempts. Click retry to try again.`
        };
      }

      const delay = getRetryDelay(newAttempts);
      console.log(`[WebSocket] Scheduling reconnection attempt ${newAttempts}/${prev.maxReconnectAttempts} in ${delay}ms`);

      // Schedule the reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        if (shouldReconnectRef.current && connectFnRef.current) {
          console.log(`[WebSocket] Executing reconnection attempt ${newAttempts}`);
          connectFnRef.current();
        }
      }, delay);

      return {
        ...prev,
        reconnectAttempts: newAttempts,
        isReconnecting: true,
        nextReconnectDelay: delay,
        isConnecting: false
      };
    });
  }, []);

  const checkServerHealth = useCallback(async () => {
    console.log('[WebSocket] Checking server health...');

    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!websocketUrl) {
      setState((prev) => ({
        ...prev,
        serverHealth: {
          status: 'not_configured',
          error: 'NEXT_PUBLIC_WEBSOCKET_URL not configured',
          last_checked: new Date().toISOString()
        }
      }));
      return;
    }

    try {
      const healthResult = await checkWebSocketHealth(websocketUrl, {
        timeout: 5000,
        include_features: true
      });

      setState((prev) => ({
        ...prev,
        serverHealth: healthResult
      }));

      console.log('[WebSocket] Server health check result:', healthResult);
    } catch (error: any) {
      console.error('[WebSocket] Server health check failed:', error);
      setState((prev) => ({
        ...prev,
        serverHealth: {
          status: 'unavailable',
          error: error.message,
          last_checked: new Date().toISOString()
        }
      }));
    }
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('[WebSocket] Force reconnect requested');
    cancelReconnect();
    resetReconnectAttempts();
    shouldReconnectRef.current = true;
    if (connectFnRef.current) {
      connectFnRef.current();
    }
  }, [cancelReconnect, resetReconnectAttempts]);

  const connect = useCallback(async () => {
    if (isConnectedRef.current || isConnectingRef.current) return
    setState((prev) => ({ ...prev, isConnecting: true, error: null }))

    // Check server health before attempting connection
    console.log('[WebSocket] Checking server health before connection...');

    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!websocketUrl) {
      const errorMsg = 'WebSocket server is not_configured: NEXT_PUBLIC_WEBSOCKET_URL not configured';
      console.warn('[WebSocket] Server health check failed:', errorMsg);

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMsg,
        serverHealth: {
          status: 'not_configured',
          error: 'NEXT_PUBLIC_WEBSOCKET_URL not configured',
          last_checked: new Date().toISOString()
        }
      }));

      shouldReconnectRef.current = false;
      onError?.(errorMsg);
      return;
    }

    // Perform health check
    try {
      const healthResult = await checkWebSocketHealth(websocketUrl, {
        timeout: 5000,
        include_features: true
      });

      setState((prev) => ({
        ...prev,
        serverHealth: healthResult
      }));

      if (healthResult.status !== 'available') {
        const errorMsg = `WebSocket server is ${healthResult.status}: ${healthResult.error || 'Server not available'}`;
        console.warn('[WebSocket] Server health check failed:', errorMsg);

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMsg
        }));

        // Don't attempt reconnection if server is not configured
        if (healthResult.status === 'not_configured') {
          shouldReconnectRef.current = false;
        }

        onError?.(errorMsg);
        return;
      }

      console.log('[WebSocket] Server health check passed, proceeding with connection');
    } catch (error: any) {
      const errorMsg = `WebSocket health check failed: ${error.message}`;
      console.error('[WebSocket] Health check error:', error);

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMsg,
        serverHealth: {
          status: 'unavailable',
          error: error.message,
          last_checked: new Date().toISOString()
        }
      }));

      onError?.(errorMsg);
      return;
    }

    if (!useWsProxy) {
      // Use WebRTC approach via startRealtimeSession
      try {
        const { startRealtimeSession } = await import('@/lib/realtime-webrtc')
        const { session } = await startRealtimeSession({
          model: process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview',
          instructions,
          voice,
        })

        // Store session reference and update state
        sessionRef.current = session
        isConnectedRef.current = true
        isConnectingRef.current = false
        // Reset reconnection state on successful connection
        cancelReconnect();
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          isReconnecting: false,
          nextReconnectDelay: 0,
          error: null
        }))
        onConnect?.()
        return
      } catch (error: any) {
        const msg = `Failed to start WebRTC session: ${error.message}`
        isConnectingRef.current = false
        setState((prev) => ({ ...prev, error: msg, isConnecting: false }))
        onError?.(msg)
        // Schedule reconnection for WebRTC failures if retriable
        if (shouldReconnectRef.current && isRetriableError(error)) {
          scheduleReconnect(error);
        }
        return
      }
    }

    // Use WebSocket proxy approach (original code)
    try {
      // Determine WebSocket URL with proper fallback handling
      let url = '';

      if (websocketUrl) {
        // Use provided WebSocket URL directly
        url = websocketUrl;
      } else if (apiBaseUrl) {
        // Fallback: construct from API base URL
        const wsBase = apiBaseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
        url = `${wsBase}/realtime`;
      } else {
        // Last resort: use current origin
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const wsBase = base.replace(/^http/i, 'ws');
        url = `${wsBase}/realtime`;
      }

      // Validate URL before attempting connection
      if (!url) {
        throw new Error('No WebSocket URL available. Please set NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_API_BASE environment variable.');
      }

      console.log('[WebSocket] Attempting to connect to:', url);
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connection established successfully');
        isConnectedRef.current = true;
        isConnectingRef.current = false;
        // Reset reconnection state on successful connection
        cancelReconnect();
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          isReconnecting: false,
          nextReconnectDelay: 0,
          error: null
        }))
        onConnect?.();

        // First, send connect_realtime to establish OpenAI connection
        console.log('[WebSocket] Sending connect_realtime message');
        ws.send(JSON.stringify({
          type: 'connect_realtime'
        }));

        // Then configure session (this will be handled after OpenAI connection is established)
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log('[WebSocket] Sending session configuration');
            ws.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions,
                voice,
                temperature,
              },
            }));
          }
        }, 1000); // Wait 1 second for OpenAI connection to establish
      }

      ws.onmessage = handleWebSocketMessage
      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        isConnectedRef.current = false;
        isConnectingRef.current = false;
        setState((prev) => ({ ...prev, isConnected: false, isConnecting: false }))
        onDisconnect?.();

        // Schedule reconnection if appropriate
        if (shouldReconnectRef.current && shouldRetry(event, state.reconnectAttempts, state.maxReconnectAttempts)) {
          console.log('[WebSocket] Connection closed, scheduling reconnection...');
          scheduleReconnect(event);
        } else {
          console.log('[WebSocket] Connection closed, not reconnecting');
        }
      }
      ws.onerror = (event) => {
        console.error('[WebSocket] Connection error:', event);
        isConnectingRef.current = false;
        let msg = 'WebSocket connection error';
        if (!websocketUrl && !apiBaseUrl) {
          msg += '. Please set NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_API_BASE environment variable.';
        }
        setState((prev) => ({ ...prev, error: msg, isConnecting: false }))
        onError?.(msg);

        // Schedule reconnection for retriable errors
        const errorForReconnect = new Error('WebSocket connection error');
        if (shouldReconnectRef.current && isRetriableError(errorForReconnect)) {
          console.log('[WebSocket] Error occurred, scheduling reconnection...');
          scheduleReconnect(errorForReconnect);
        }
      }
    } catch (e: any) {
      console.error('[WebSocket] Failed to connect:', e);
      isConnectingRef.current = false;
      let msg = `Failed to connect to WebSocket server: ${e.message}`;
      if (!websocketUrl && !apiBaseUrl) {
        msg += '. Please set NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_API_BASE environment variable.';
      }
      setState((prev) => ({ ...prev, error: msg, isConnecting: false }))
      onError?.(msg);

      // Schedule reconnection for retriable errors
      if (shouldReconnectRef.current && isRetriableError(e)) {
        console.log('[WebSocket] Connection attempt failed, scheduling reconnection...');
        scheduleReconnect(e);
      }
    }
  }, [useWsProxy, websocketUrl, apiBaseUrl, instructions, voice, temperature, handleWebSocketMessage, onConnect, onDisconnect, onError, cancelReconnect, scheduleReconnect])

  // Update the connect function ref
  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Manual disconnect requested');
    // Disable automatic reconnection
    shouldReconnectRef.current = false;
    cancelReconnect();

    if (!useWsProxy && sessionRef.current) {
      // WebRTC path - disconnect RealtimeSession
      try {
        sessionRef.current.disconnect?.()
      } catch (error) {
        console.warn('Error disconnecting RealtimeSession:', error)
      }
      sessionRef.current = null
    } else if (wsRef.current) {
      // WebSocket proxy path
      try { wsRef.current.close() } catch {}
      wsRef.current = null
    }
    isConnectedRef.current = false
    isConnectingRef.current = false
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      nextReconnectDelay: 0
    }))
    onDisconnect?.()
  }, [useWsProxy, onDisconnect, cancelReconnect])

  const startListening = useCallback(async () => {
    if (!useWsProxy && !sessionRef.current) return
    if (useWsProxy && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) return
    if (state.isListening) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        const pcm16 = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        if (!useWsProxy && sessionRef.current) {
          // WebRTC path - send audio to RealtimeSession
          try {
            sessionRef.current.sendAudio?.(pcm16.buffer)
          } catch (error) {
            console.warn('Error sending audio to RealtimeSession:', error)
          }
        } else if (wsRef.current?.readyState === WebSocket.OPEN) {
          // WebSocket proxy path
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)))
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: audioBase64 }))
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      mediaStreamRef.current = stream
      audioContextRef.current = audioContext
      processorRef.current = processor

      setState((prev) => ({ ...prev, isListening: true }))
    } catch (error) {
      const errorMessage = 'Failed to start audio capture'
      setState((prev) => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
    }
  }, [state.isListening, useWsProxy, onError])

  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (!useWsProxy && sessionRef.current) {
      // WebRTC path - commit audio buffer to RealtimeSession
      try {
        sessionRef.current.commitAudio?.()
      } catch (error) {
        console.warn('Error committing audio to RealtimeSession:', error)
      }
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      // WebSocket proxy path
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
    }
    setState((prev) => ({ ...prev, isListening: false }))
  }, [useWsProxy])

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (!useWsProxy && sessionRef.current) {
      // WebRTC path - send audio to RealtimeSession
      try {
        sessionRef.current.sendAudio?.(audioData)
      } catch (error) {
        console.warn('Error sending audio to RealtimeSession:', error)
      }
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      // WebSocket proxy path
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioData)))
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: audioBase64 }))
    }
  }, [useWsProxy])

  const sendText = useCallback((text: string) => {
    if (!useWsProxy && sessionRef.current) {
      // WebRTC path - send text to RealtimeSession
      try {
        currentTranscriptRef.current = ''
        sessionRef.current.sendText?.(text)
      } catch (error) {
        console.warn('Error sending text to RealtimeSession:', error)
      }
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      // WebSocket proxy path
      currentTranscriptRef.current = ''
      wsRef.current.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
        }),
      )
      wsRef.current.send(JSON.stringify({ type: 'response.create' }))
    } else {
      return
    }
    // Optional fanout
    try {
      fetch('/api/voice/fanout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'text_input', text, at: Date.now() }),
      })
    } catch {}
  }, [useWsProxy])

  const clearMessages = useCallback(() => setState((prev) => ({ ...prev, messages: [] })), [])
  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: null })), [])
  const setVadEnabled = useCallback((enabled: boolean) => {
    // Placeholder for future VAD toggle; currently no-op
    console.debug('setVadEnabled:', enabled)
  }, [])

  useEffect(() => () => {
    // Cleanup on unmount
    shouldReconnectRef.current = false;
    cancelReconnect();
    disconnect();
  }, [disconnect, cancelReconnect])

  // Keep connection flags in refs to avoid re-creating connect()
  useEffect(() => {
    isConnectedRef.current = state.isConnected
    isConnectingRef.current = state.isConnecting
  }, [state.isConnected, state.isConnecting])

  const actions = useMemo<RealtimeActions>(() => ({
    connect,
    disconnect,
    startListening,
    stopListening,
    sendAudio,
    sendText,
    clearMessages,
    clearError,
    forceReconnect,
    cancelReconnect,
    resetReconnectAttempts,
    checkServerHealth,
    setVadEnabled,
  }), [connect, disconnect, startListening, stopListening, sendAudio, sendText, clearMessages, clearError, forceReconnect, cancelReconnect, resetReconnectAttempts, checkServerHealth, setVadEnabled])

  return [state, actions] as const
}

