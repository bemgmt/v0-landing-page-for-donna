"use client"

import { useEffect, useState, useRef } from "react"
import { track } from "@vercel/analytics"

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldShow, setShouldShow] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    
    // Check localStorage for intro seen
    const introSeen = localStorage.getItem("donnaIntroSeen") === "1"
    
    if (reducedMotion || introSeen) {
      // Skip intro if reduced motion or already seen
      setIsVisible(false)
      setShouldShow(false)
      // Trigger scroll cue to show
      const event = new CustomEvent("introComplete")
      window.dispatchEvent(event)
      return
    }

    // Show intro
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
        // Ensure video plays after loading
        video.play().catch((err) => {
          console.error("Video autoplay failed:", err)
        })
      }
    }

    // Set source on mount
    setVideoSource()

    const handleEnded = () => {
      finishIntro("ended")
    }

    const handleError = () => {
      // Fallback if video fails to load
      finishIntro("error")
    }

    video.addEventListener("ended", handleEnded)
    video.addEventListener("error", handleError)

    // Safety timeout (12 seconds)
    const timeout = setTimeout(() => {
      finishIntro("timeout")
    }, 12000)

    return () => {
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("error", handleError)
      clearTimeout(timeout)
    }
  }, [])

  const finishIntro = (reason: string) => {
    if (!isVisible) return
    
    setIsVisible(false)
    localStorage.setItem("donnaIntroSeen", "1")
    
    // Track analytics
    if (reason === "ended") {
      track("intro_played")
    } else if (reason === "skipped") {
      track("intro_skipped")
    }

    // Trigger scroll cue to show
    setTimeout(() => {
      const event = new CustomEvent("introComplete")
      window.dispatchEvent(event)
    }, 100)
  }

  const handleSkip = () => {
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

