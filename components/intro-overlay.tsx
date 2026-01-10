"use client"

import { useEffect, useState, useRef } from "react"
import { track } from "@vercel/analytics"

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldShow, setShouldShow] = useState(false)
  const isSkippedRef = useRef(false)
  const isFinishedRef = useRef(false)
  const playbackStartedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const playbackCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playAttemptsRef = useRef(0)

  // Check connection quality
  const checkConnectionQuality = (): boolean => {
    // Check if navigator.connection is available (Chrome/Edge)
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      const effectiveType = conn?.effectiveType
      // Skip if connection is slow (2g or slow-2g)
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return false
      }
      // Skip if saveData is enabled
      if (conn?.saveData) {
        return false
      }
    }
    
    // Check if navigator is online
    if (!navigator.onLine) {
      return false
    }
    
    return true
  }

  const finishIntro = (reason: string) => {
    // Prevent multiple calls
    if (isFinishedRef.current) return
    isFinishedRef.current = true
    
    // Clear any pending timeouts
    if (playbackCheckTimeoutRef.current) {
      clearTimeout(playbackCheckTimeoutRef.current)
      playbackCheckTimeoutRef.current = null
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }
    
    setIsVisible(false)
    
    // Track analytics
    if (reason === "ended") {
      track("intro_played")
    } else if (reason === "skipped") {
      track("intro_skipped")
    } else if (reason === "autoplay_failed") {
      track("intro_autoplay_failed")
    } else if (reason === "error") {
      track("intro_error")
    } else if (reason === "timeout") {
      track("intro_timeout")
    }

    // Trigger scroll cue to show
    setTimeout(() => {
      const event = new CustomEvent("introComplete")
      window.dispatchEvent(event)
    }, 100)
  }

  // Attempt to play video with retries
  const attemptPlay = async (video: HTMLVideoElement, retries = 3): Promise<boolean> => {
    try {
      await video.play()
      return true
    } catch (err) {
      playAttemptsRef.current++
      if (playAttemptsRef.current < retries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500))
        return attemptPlay(video, retries)
      }
      console.error("Video autoplay failed after retries:", err)
      return false
    }
  }

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    
    // Check connection quality
    const hasGoodConnection = checkConnectionQuality()
    
    if (reducedMotion || !hasGoodConnection) {
      // Skip intro if reduced motion or bad connection
      setIsVisible(false)
      setShouldShow(false)
      // Trigger scroll cue to show
      const event = new CustomEvent("introComplete")
      window.dispatchEvent(event)
      return
    }

    // Show intro on every visit (unless reduced motion or bad connection)
    setShouldShow(true)
    const video = videoRef.current
    if (!video) return

    // Set appropriate video source based on screen size
    const setVideoSource = () => {
      const isMobile = window.innerWidth <= 600
      const sources = video.querySelectorAll("source")
      let selectedSrc = ""
      
      sources.forEach((source) => {
        const media = source.getAttribute("data-media")
        const src = source.getAttribute("src")
        if (isMobile && media?.includes("max-width: 600px") && src) {
          selectedSrc = src
        } else if (!isMobile && !media && src) {
          selectedSrc = src
        }
      })
      
      if (selectedSrc) {
        video.src = selectedSrc
        video.load()
      }
    }

    // Set source on mount
    setVideoSource()

    // Handle video events
    const handlePlay = () => {
      playbackStartedRef.current = true
      // Clear the playback check timeout since we confirmed playback started
      if (playbackCheckTimeoutRef.current) {
        clearTimeout(playbackCheckTimeoutRef.current)
        playbackCheckTimeoutRef.current = null
      }
    }

    const handlePlaying = () => {
      playbackStartedRef.current = true
      // Clear the playback check timeout since we confirmed playback started
      if (playbackCheckTimeoutRef.current) {
        clearTimeout(playbackCheckTimeoutRef.current)
        playbackCheckTimeoutRef.current = null
      }
    }

    const handleEnded = () => {
      // Automatically finish intro when video ends
      finishIntro("ended")
    }

    const handleError = () => {
      // Fallback if video fails to load
      finishIntro("error")
    }

    const handleLoadedMetadata = async () => {
      // Wait for metadata to load before attempting to play
      const playSuccess = await attemptPlay(video)
      if (!playSuccess) {
        // If autoplay fails, set up a check to skip after short delay
        playbackCheckTimeoutRef.current = setTimeout(() => {
          if (!playbackStartedRef.current) {
            finishIntro("autoplay_failed")
          }
        }, 2500) // 2.5 seconds to detect if playback hasn't started
      }
    }

    const handleCanPlay = async () => {
      // If we haven't started playing yet and metadata is loaded, try to play
      if (!playbackStartedRef.current && video.readyState >= 2) {
        const playSuccess = await attemptPlay(video)
        if (!playSuccess && !playbackCheckTimeoutRef.current) {
          // Set up check to skip if playback doesn't start
          playbackCheckTimeoutRef.current = setTimeout(() => {
            if (!playbackStartedRef.current) {
              finishIntro("autoplay_failed")
            }
          }, 2500)
        }
      }
    }

    // Add event listeners
    video.addEventListener("play", handlePlay)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("error", handleError)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("canplay", handleCanPlay)

    // Playback detection timeout - check if video hasn't started playing within 3 seconds
    playbackCheckTimeoutRef.current = setTimeout(() => {
      if (!playbackStartedRef.current) {
        finishIntro("autoplay_failed")
      }
    }, 3000)

    // Safety timeout - only set if video is actually playing
    // This will be a longer timeout (video duration + buffer) but only active if playback started
    const setupSafetyTimeout = () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
      }
      // Estimate video duration or use a reasonable max (15 seconds)
      // Only set if playback has started
      if (playbackStartedRef.current) {
        const videoDuration = video.duration || 15
        safetyTimeoutRef.current = setTimeout(() => {
          // Only timeout if intro hasn't finished yet
          if (!isFinishedRef.current) {
            finishIntro("timeout")
          }
        }, (videoDuration * 1000) + 2000) // Video duration + 2 second buffer
      }
    }

    // Monitor playback state to set up safety timeout
    const checkPlaybackState = setInterval(() => {
      if (playbackStartedRef.current && !safetyTimeoutRef.current) {
        setupSafetyTimeout()
      }
    }, 500)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("canplay", handleCanPlay)
      if (playbackCheckTimeoutRef.current) {
        clearTimeout(playbackCheckTimeoutRef.current)
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
      }
      clearInterval(checkPlaybackState)
    }
  }, [])

  const handleSkip = () => {
    isSkippedRef.current = true
    finishIntro("skipped")
  }

  if (!shouldShow) return null

  return (
    <div
      ref={overlayRef}
      id="introOverlay"
      className={`intro fixed inset-0 z-[9999] flex items-center justify-center bg-black ${
        isVisible ? "" : "fadeOut"
      }`}
    >
      <button
        id="skipIntro"
        onClick={handleSkip}
        className="skip absolute top-4 right-4 z-[2] bg-black/40 text-white border border-white/20 px-3 py-2 rounded-full text-sm hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Skip intro"
      >
        Skip
      </button>

      <video
        id="introVideo"
        ref={videoRef}
        className="introVideo w-full h-full object-contain md:object-cover"
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/intro/donna_intro_poster.jpg"
      >
        <source src="/intro/donna_intro_480p.mp4" type="video/mp4" data-media="(max-width: 600px)" />
        <source src="/intro/donna_intro_720p.mp4" type="video/mp4" />
      </video>

    </div>
  )
}

