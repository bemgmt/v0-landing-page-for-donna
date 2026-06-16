import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioPlayerState {
  isPlaying: boolean
  isLoading: boolean
  duration: number
  currentTime: number
  volume: number
  error: string | null
}

export interface AudioPlayerActions {
  play: (audioData?: string | Blob) => Promise<void>
  pause: () => void
  stop: () => void
  setVolume: (volume: number) => void
  seek: (time: number) => void
  clearError: () => void
}

export interface UseAudioPlayerOptions {
  autoPlay?: boolean
  loop?: boolean
  volume?: number
  onEnded?: () => void
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadEnd?: () => void
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    autoPlay = false,
    loop = false,
    volume: initialVolume = 1,
    onEnded,
    onError,
    onLoadStart,
    onLoadEnd
  } = options

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    volume: initialVolume,
    error: null
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.volume = initialVolume
    audio.loop = loop

    // Event listeners
    audio.addEventListener('loadstart', () => {
      setState(prev => ({ ...prev, isLoading: true }))
      onLoadStart?.()
    })

    audio.addEventListener('loadedmetadata', () => {
      setState(prev => ({ 
        ...prev, 
        duration: audio.duration,
        isLoading: false 
      }))
      onLoadEnd?.()
    })

    audio.addEventListener('canplaythrough', () => {
      setState(prev => ({ ...prev, isLoading: false }))
      if (autoPlay) {
        audio.play().catch(error => {
          const errorMessage = 'Autoplay failed: ' + error.message
          setState(prev => ({ ...prev, error: errorMessage }))
          onError?.(errorMessage)
        })
      }
    })

    audio.addEventListener('play', () => {
      setState(prev => ({ ...prev, isPlaying: true }))
      startTimeTracking()
    })

    audio.addEventListener('pause', () => {
      setState(prev => ({ ...prev, isPlaying: false }))
      stopTimeTracking()
    })

    audio.addEventListener('ended', () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        currentTime: 0
      }))
      stopTimeTracking()
      onEnded?.()
    })

    audio.addEventListener('error', (event) => {
      const error = audio.error
      const errorMessage = error ? 
        `Audio error: ${error.message} (Code: ${error.code})` : 
        'Unknown audio error'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isPlaying: false,
        isLoading: false
      }))
      onError?.(errorMessage)
      stopTimeTracking()
    })

    audio.addEventListener('volumechange', () => {
      setState(prev => ({ ...prev, volume: audio.volume }))
    })

    audioRef.current = audio

    return () => {
      stopTimeTracking()
      audio.pause()
      audio.src = ''
      audio.load()
    }
  }, [autoPlay, loop, initialVolume, onEnded, onError, onLoadStart, onLoadEnd])

  // Time tracking
  const startTimeTracking = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
    }

    timeUpdateIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setState(prev => ({ 
          ...prev, 
          currentTime: audioRef.current!.currentTime 
        }))
      }
    }, 100)
  }, [])

  const stopTimeTracking = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = undefined
    }
  }, [])

  // Play audio
  const play = useCallback(async (audioData?: string | Blob) => {
    if (!audioRef.current) return

    try {
      setState(prev => ({ ...prev, error: null }))

      // If new audio data is provided, load it
      if (audioData) {
        setState(prev => ({ ...prev, isLoading: true }))

        if (typeof audioData === 'string') {
          // Base64 audio data
          const audioBlob = base64ToBlob(audioData, 'audio/mpeg')
          const audioUrl = URL.createObjectURL(audioBlob)
          audioRef.current.src = audioUrl
        } else {
          // Blob audio data
          const audioUrl = URL.createObjectURL(audioData)
          audioRef.current.src = audioUrl
        }

        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          const audio = audioRef.current!
          
          const onCanPlay = () => {
            audio.removeEventListener('canplaythrough', onCanPlay)
            audio.removeEventListener('error', onError)
            resolve(void 0)
          }

          const onError = () => {
            audio.removeEventListener('canplaythrough', onCanPlay)
            audio.removeEventListener('error', onError)
            reject(new Error('Failed to load audio'))
          }

          audio.addEventListener('canplaythrough', onCanPlay)
          audio.addEventListener('error', onError)
        })
      }

      await audioRef.current.play()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio'
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isPlaying: false,
        isLoading: false
      }))
      onError?.(errorMessage)
    }
  }, [onError])

  // Pause audio
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }, [])

  // Stop audio
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setState(prev => ({ ...prev, currentTime: 0 }))
    }
  }, [])

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      audioRef.current.volume = clampedVolume
    }
  }, [])

  // Seek to time
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      const clampedTime = Math.max(0, Math.min(state.duration, time))
      audioRef.current.currentTime = clampedTime
      setState(prev => ({ ...prev, currentTime: clampedTime }))
    }
  }, [state.duration])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const actions: AudioPlayerActions = {
    play,
    pause,
    stop,
    setVolume,
    seek,
    clearError
  }

  return [state, actions] as const
}

// Helper function to convert base64 to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '')
  
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// Helper function to format time
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
