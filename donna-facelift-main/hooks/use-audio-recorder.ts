import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioRecorderState {
  isRecording: boolean
  isProcessing: boolean
  audioLevel: number
  duration: number
  error: string | null
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  cancelRecording: () => void
  clearError: () => void
}

export interface UseAudioRecorderOptions {
  onAudioData?: (audioBlob: Blob) => void
  onTranscription?: (text: string) => void
  onError?: (error: string) => void
  autoStop?: number // Auto-stop after N milliseconds
  vadThreshold?: number // Voice activity detection threshold (0-1)
  enableVAD?: boolean // Enable voice activity detection
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const {
    onAudioData,
    onTranscription,
    onError,
    autoStop,
    vadThreshold = 0.01,
    enableVAD = true
  } = options

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isProcessing: false,
    audioLevel: 0,
    duration: 0,
    error: null
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const durationIntervalRef = useRef<NodeJS.Timeout>()
  const autoStopTimeoutRef = useRef<NodeJS.Timeout>()
  const vadTimeoutRef = useRef<NodeJS.Timeout>()
  const lastVoiceActivityRef = useRef<number>(0)

  // Clean up function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current)
    }
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }, [])

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sum / dataArray.length)
    const audioLevel = rms / 255 // Normalize to 0-1

    setState(prev => ({ ...prev, audioLevel }))

    // Voice Activity Detection
    if (enableVAD && audioLevel > vadThreshold) {
      lastVoiceActivityRef.current = Date.now()
      
      // Clear any existing VAD timeout
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current)
      }
    } else if (enableVAD && state.isRecording) {
      // If no voice activity for 2 seconds, consider stopping
      const silenceDuration = Date.now() - lastVoiceActivityRef.current
      if (silenceDuration > 2000 && !vadTimeoutRef.current) {
        vadTimeoutRef.current = setTimeout(() => {
          stopRecording()
        }, 1000) // Additional 1 second grace period
      }
    }

    if (state.isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
    }
  }, [state.isRecording, enableVAD, vadThreshold])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }))

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })

      streamRef.current = stream

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onAudioData?.(audioBlob)
        cleanup()
      }

      mediaRecorder.onerror = (event) => {
        const error = 'Recording error occurred'
        setState(prev => ({ ...prev, error, isRecording: false, isProcessing: false }))
        onError?.(error)
        cleanup()
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms

      // Start monitoring
      startTimeRef.current = Date.now()
      lastVoiceActivityRef.current = Date.now()
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        duration: 0
      }))

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        const duration = Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, duration }))
      }, 100)

      // Start audio level monitoring
      monitorAudioLevel()

      // Auto-stop if specified
      if (autoStop) {
        autoStopTimeoutRef.current = setTimeout(() => {
          stopRecording()
        }, autoStop)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isRecording: false, 
        isProcessing: false 
      }))
      onError?.(errorMessage)
      cleanup()
    }
  }, [onAudioData, onError, autoStop, monitorAudioLevel])

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !state.isRecording) {
      return null
    }

    setState(prev => ({ ...prev, isProcessing: true }))

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setState(prev => ({
          ...prev,
          isRecording: false,
          isProcessing: false,
          audioLevel: 0
        }))
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }, [state.isRecording])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        audioLevel: 0,
        duration: 0
      }))
      cleanup()
    }
  }, [state.isRecording, cleanup])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const actions: AudioRecorderActions = {
    startRecording,
    stopRecording,
    cancelRecording,
    clearError
  }

  return [state, actions] as const
}
