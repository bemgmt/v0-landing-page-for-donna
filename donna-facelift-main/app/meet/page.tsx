"use client"

import { useEffect, useRef, useState } from 'react'

type SRResultEvent = { results: ArrayLike<{ 0: { transcript: string } }> }
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SRResultEvent) => void
  onstart: () => void
  onend: () => void
  onerror: () => void
  start: () => void
  stop: () => void
}
type SRConstructor = new () => SpeechRecognitionLike

export default function MeetAssistantPage() {
  const [status, setStatus] = useState('idle')
  const [lastHeard, setLastHeard] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Basic browser speech recognition to demo "hey donna" trigger during meetings
    const win = window as unknown as {
      webkitSpeechRecognition?: SRConstructor
      SpeechRecognition?: SRConstructor
    }
    const SRCtor = win.webkitSpeechRecognition || win.SpeechRecognition
    if (!SRCtor) {
      setStatus('speech recognition unavailable')
      return
    }

    const recognition: SpeechRecognitionLike = new SRCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SRResultEvent) => {
      const transcript = Array.from(event.results as ArrayLike<{ 0: { transcript: string } }>)
        .map((r) => r[0].transcript)
        .join(' ')
        .toLowerCase()
      setLastHeard(transcript)
      if (transcript.includes('hey donna') || transcript.includes('hey, donna')) {
        // Broadcast a custom event the widget listens for
        window.dispatchEvent(new CustomEvent('donna:open'))
      }
    }

    recognition.onstart = () => setStatus('listening (say "hey donna")')
    recognition.onend = () => setStatus('restarting…')
    recognition.onerror = () => setStatus('error (will retry)')

    try { recognition.start() } catch {}
    recognitionRef.current = recognition

    const timer = setInterval(() => {
      if (recognitionRef.current && statusRef.current !== 'listening (say "hey donna")') {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.start()
        } catch {}
      }
    }, 5000)

    return () => {
      clearInterval(timer)
      try { recognition.stop() } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-2xl font-light mb-2">Google Meet Assistant (Preview)</h1>
      <p className="text-white/60 mb-6">DONNA listens for the phrase &quot;hey donna&quot; during your meeting and opens the assistant.</p>
      <div className="text-sm text-white/70">Status: {status}</div>
      <div className="mt-2 text-xs text-white/40">Last heard: {lastHeard}</div>
      <div className="mt-8 text-xs text-white/40">Tip: Keep this tab open during your meeting. A Chrome Extension can integrate directly with meet.google.com later.</div>
    </div>
  )
}

