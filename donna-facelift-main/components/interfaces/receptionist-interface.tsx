"use client"

import { motion } from "framer-motion"
import { Mic, MicOff, Volume2, VolumeX, PhoneCall, PhoneOff, Settings, User } from "lucide-react"
import { useState, useEffect } from "react"
import { useOpenAIRealtime } from "@/hooks/use-openai-realtime"
import { formatTime } from "@/hooks/use-audio-player"
import { useTelnyxCalls } from "@/hooks/use-telnyx-calls"

// Declare window augmentation for latch mode without using `any`
declare global {
  interface Window { __DONNA_LATCH__?: boolean }
}

export default function ReceptionistInterface() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDialer, setShowDialer] = useState(false)
  const [dialNumber, setDialNumber] = useState("")
  const [currentCaller, setCurrentCaller] = useState<string | null>(null)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)

  // Telnyx call management hook
  const [telnyxState, telnyxActions] = useTelnyxCalls()

  // OpenAI Realtime API hook for real-time streaming
  const [realtimeState, realtimeActions] = useOpenAIRealtime({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE || '',
    instructions: 'You are DONNA, a professional AI receptionist. Handle calls efficiently, be friendly and helpful. Keep responses concise and professional.',
    voice: 'alloy', // OpenAI voice for realtime (will be processed through ElevenLabs later)
    temperature: 0.7,
    onError: (error: unknown) => console.error('Realtime API error:', error),
    onConnect: () => console.log('Connected to OpenAI Realtime API'),
    onDisconnect: () => console.log('Disconnected from OpenAI Realtime API')
  })

  // Call history with more realistic data
  const [callHistory, setCallHistory] = useState([
    { id: 1, caller: "John Smith", time: "2:30 PM", duration: "3:45", status: "completed", type: "inquiry" },
    { id: 2, caller: "Sarah Wilson", time: "1:15 PM", duration: "2:12", status: "completed", type: "appointment" },
    { id: 3, caller: "Mike Johnson", time: "11:30 AM", duration: "1:33", status: "missed", type: "callback" },
    { id: 4, caller: "Emma Davis", time: "10:45 AM", duration: "5:22", status: "completed", type: "support" },
  ])

// Initialize realtime connection
  const { connect, disconnect } = realtimeActions
  useEffect(() => {
    // Keep auto-connect for now; explicit controls also provided
    connect()
    return () => { disconnect() }
  }, [connect, disconnect])

  // Dev-only keyboard shortcuts: Space (hold-to-talk), V (toggle VAD), L (toggle latch)
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production' || new URLSearchParams(window.location.search).get('realtime_dev') === '1'
    if (!isDev) return
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!(window.__DONNA_LATCH__ ?? true)) {
          e.preventDefault()
          realtimeActions.startListening()
        }
      } else if (e.key === 'v' || e.key === 'V') {
        realtimeActions.setVadEnabled?.(true)
      } else if (e.key === 'l' || e.key === 'L') {
        window.__DONNA_LATCH__ = !(window.__DONNA_LATCH__ ?? true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!(window.__DONNA_LATCH__ ?? true)) {
          e.preventDefault()
          realtimeActions.stopListening()
        }
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [realtimeActions])

  // Update call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive, callStartTime])

  // Handle incoming call simulation
  const handleIncomingCall = (callerName: string) => {
    setCurrentCaller(callerName)
    setIsCallActive(true)
    setCallStartTime(new Date())
    setCallDuration(0)

    // Start real-time listening for the call
    realtimeActions.startListening()
  }

  // Handle call end
  const handleEndCall = async () => {
    // Stop real-time listening
    realtimeActions.stopListening()

    // Hang up via Telnyx if we have a call ID
    if (currentCallId) {
      try {
        await telnyxActions.hangupCall(currentCallId)
      } catch (error) {
        console.error('Error hanging up call:', error)
      }
    }

    // Add to call history
    if (currentCaller && callStartTime) {
      const newCall = {
        id: Date.now(),
        caller: currentCaller,
        time: callStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: formatTime(callDuration),
        status: 'completed' as const,
        type: 'inquiry' as const
      }
      setCallHistory(prev => [newCall, ...prev])
    }

    setIsCallActive(false)
    setCurrentCaller(null)
    setCurrentCallId(null)
    setCallStartTime(null)
    setCallDuration(0)
  }

  // Handle voice recording toggle (for manual control)
  const handleVoiceToggle = async () => {
    if (realtimeState.isListening) {
      realtimeActions.stopListening()
    } else {
      realtimeActions.startListening()
    }
  }

  // Simulate incoming call (for testing)
  const simulateIncomingCall = () => {
    const callers = ["Alex Thompson", "Maria Garcia", "David Chen", "Lisa Anderson"]
    const randomCaller = callers[Math.floor(Math.random() * callers.length)]
    handleIncomingCall(randomCaller)
  }

  // Initiate outbound call via Telnyx
  const handleOutboundCall = async () => {
    if (!dialNumber.trim()) {
      alert('Please enter a phone number')
      return
    }

    try {
      const result = await telnyxActions.initiateCall(dialNumber)
      
      if (result.success && result.call_id) {
        setCurrentCallId(result.call_id)
        setCurrentCaller(dialNumber)
        setIsCallActive(true)
        setCallStartTime(new Date())
        setCallDuration(0)
        setShowDialer(false)
        setDialNumber("")
        
        // Start real-time listening for the call
        realtimeActions.startListening()
      } else {
        alert(`Call failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Call initiation error:', error)
      alert('Failed to initiate call')
    }
  }

  // Handle incoming call from webhook (would be called by webhook handler)
  const handleIncomingCallFromWebhook = (callData: { call_id: string; from: string; to: string }) => {
    setCurrentCallId(callData.call_id)
    setCurrentCaller(callData.from)
    setIsCallActive(true)
    setCallStartTime(new Date())
    setCallDuration(0)
    realtimeActions.startListening()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen pt-20 glass-dark backdrop-blur">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-light">🧠 AI Receptionist</h2>
            <p className="text-sm text-white/60 mt-1">
              {isCallActive
                ? `Active call with ${currentCaller} • ${formatTime(callDuration)}`
                : 'Real-time voice AI receptionist • Ready for calls'
              }
              {realtimeState.isConnected && ' • Realtime API connected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => realtimeState.isConnected ? realtimeActions.disconnect() : realtimeActions.connect()}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                realtimeState.isConnected
                  ? 'border-yellow-500/60 text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20'
                  : 'border-blue-500/60 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'
              }`}
              title={realtimeState.isConnected ? 'Disconnect realtime' : 'Connect realtime'}
            >
              {realtimeState.isConnected ? 'Stop Realtime' : 'Start Realtime'}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full border border-white/40 bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
              title="Voice settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {!isCallActive && (
              <>
                <button
                  onClick={() => setShowDialer(!showDialer)}
                  className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  title="Make outbound call"
                >
                  <PhoneCall className="w-3 h-3 inline mr-1" />
                  Dial
                </button>
                <button
                  onClick={simulateIncomingCall}
                  className="px-3 py-1 text-xs bg-green-500/20 border border-green-500/40 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  title="Simulate incoming call"
                >
                  Test Call
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialer Panel */}
      {showDialer && !isCallActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-white/20 p-4 donna-glass donna-gradient-border"
        >
          <h3 className="text-sm font-medium mb-3">Make Outbound Call</h3>
          <div className="flex gap-2">
            <input
              type="tel"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="Enter phone number (e.g., +1234567890)"
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-blue-500/60"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleOutboundCall()
                }
              }}
            />
            <button
              onClick={handleOutboundCall}
              disabled={!dialNumber.trim() || telnyxState.isCalling}
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {telnyxState.isCalling ? 'Calling...' : 'Call'}
            </button>
            <button
              onClick={() => {
                setShowDialer(false)
                setDialNumber("")
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white/60 rounded hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
          {telnyxState.error && (
            <p className="text-xs text-red-400 mt-2">{telnyxState.error}</p>
          )}
        </motion.div>
      )}

      {/* Voice Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-white/20 p-4 donna-glass donna-gradient-border"
        >
          <h3 className="text-sm font-medium mb-3">Receptionist Voice Settings</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-white/60 mb-1 block">Realtime API Status</label>
              <div className={`text-xs px-2 py-1 rounded ${
                realtimeState.isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : realtimeState.isConnecting
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {realtimeState.isConnected ? 'Connected' : realtimeState.isConnecting ? 'Connecting' : 'Disconnected'}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Voice Processing</label>
              <div className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                OpenAI Realtime → ElevenLabs
              </div>
              <div className="text-xs text-white/60 mt-1">
                Voice ID: XcXEQzuLXRU9RcfWzEJt
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Call Status</label>
              <div className={`text-xs px-2 py-1 rounded ${
                isCallActive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {isCallActive ? 'In Call' : 'Available'}
              </div>
            </div>
            {/* Dev-only realtime controls */}
            {typeof window !== 'undefined' && (process.env.NODE_ENV !== 'production' || new URLSearchParams(window.location.search).get('realtime_dev') === '1') && (
              <>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Mic Control</label>
                  <div className="flex gap-2">
                    <button
                onClick={() => { window.__DONNA_LATCH__ = true }}
                      className="text-xs px-2 py-1 rounded border border-white/30 text-white/80 hover:bg-white/10"
                      title="Click to toggle listening"
                    >
                      Latch
                    </button>
                    <button
                onClick={() => { window.__DONNA_LATCH__ = false }}
                      className="text-xs px-2 py-1 rounded border border-white/30 text-white/80 hover:bg-white/10"
                      title="Hold mouse to talk"
                    >
                      Hold
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">VAD (WebRTC)</label>
                  <button
                    onClick={() => realtimeActions.setVadEnabled?.(true)}
                    className="text-xs px-2 py-1 rounded border border-white/30 text-white/80 hover:bg-white/10 mr-2"
                    title="Enable server-side VAD (WebRTC/proxy)"
                  >
                    Enable
                  </button>
                  <button
                    onClick={() => realtimeActions.setVadEnabled?.(false)}
                    className="text-xs px-2 py-1 rounded border border-white/30 text-white/80 hover:bg-white/10"
                    title="Disable VAD (default)"
                  >
                    Disable
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Voice Controls */}
        <div className="glass border border-white/20 rounded-lg p-6">
          <h3 className="font-medium mb-6">
            {isCallActive ? `Call with ${currentCaller}` : 'Voice Assistant'}
          </h3>

          <div className="flex flex-col items-center space-y-6">
            {/* Main voice control button */}
            <div className="relative">
              <motion.div
                className={`w-24 h-24 rounded-full border-2 flex items-center justify-center ${
                  realtimeState.isConnecting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${
                  realtimeState.isListening
                    ? "border-red-500 bg-red-500/20"
                    : realtimeState.isConnected && isCallActive
                    ? "border-green-500 bg-green-500/20"
                    : realtimeState.isConnected
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/40 bg-white/10"
                }`}
                whileTap={{ scale: 0.95 }}
onClick={realtimeState.isConnecting ? undefined : (() => { /* latch mode default */ if ((window.__DONNA_LATCH__ ?? true)) { handleVoiceToggle() } })}
                onMouseDown={realtimeState.isConnecting ? undefined : (() => { if (!(window.__DONNA_LATCH__ ?? true)) realtimeActions.startListening() })}
                onMouseUp={realtimeState.isConnecting ? undefined : (() => { if (!(window.__DONNA_LATCH__ ?? true)) realtimeActions.stopListening() })}
                onMouseLeave={realtimeState.isConnecting ? undefined : (() => { if (!(window.__DONNA_LATCH__ ?? true) && realtimeState.isListening) realtimeActions.stopListening() })}
              >
                {realtimeState.isListening ? (
                  <MicOff className="w-8 h-8 text-red-400" />
                ) : realtimeState.isConnected ? (
                  <Mic className="w-8 h-8 text-green-400" />
                ) : (
                  <Mic className="w-8 h-8 text-white/40" />
                )}
              </motion.div>

              {/* Listening animation */}
              {realtimeState.isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                />
              )}

              {/* Speaking animation */}
              {realtimeState.isSpeaking && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-500"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                />
              )}

              {/* Audio level indicator */}
              {realtimeState.isListening && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="glass-dark px-2 py-1 rounded text-xs text-white">
                    {Math.round(realtimeState.audioLevel * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* Status text */}
            <div className="text-center">
              <p className="text-sm text-white/80">
                {!realtimeState.isConnected
                  ? "Connecting to Realtime API..."
                  : realtimeState.isListening
                  ? "Listening... Speak now"
                  : realtimeState.isSpeaking
                  ? "DONNA is speaking..."
                  : isCallActive
                  ? "Real-time conversation active"
                  : "Ready for real-time calls"
                }
              </p>
              {realtimeState.error?.toLowerCase().includes('microphone') && (
                <p className="text-xs text-red-400 mt-1">Microphone blocked — enable permissions or continue typing.</p>
              )}
              {isCallActive && (
                <p className="text-xs text-white/60 mt-1">
                  Call duration: {formatTime(callDuration)} • Real-time mode
                </p>
              )}
              {realtimeState.currentTranscript && (
<p className="text-xs text-blue-400 mt-1 italic">
                  &quot;{realtimeState.currentTranscript}&quot;
                </p>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex gap-4">
              <button
                disabled={!realtimeState.isSpeaking}
                className={`p-3 rounded-full border transition-colors ${
                  realtimeState.isSpeaking
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-white/40 bg-white/10 text-white/40"
                }`}
                title={realtimeState.isSpeaking ? "Assistant speaking" : "No audio playing"}
              >
                {realtimeState.isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={isCallActive ? handleEndCall : simulateIncomingCall}
                className={`p-3 rounded-full border transition-colors ${
                  isCallActive
                    ? "border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                }`}
                title={isCallActive ? "End call" : "Start test call"}
              >
                {isCallActive ? <PhoneOff className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Call History & Conversation */}
        <div className="glass border border-white/20 rounded-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              {isCallActive ? 'Current Conversation' : 'Recent Calls'}
            </h3>
            {isCallActive && (
              <div className="text-xs text-white/60">
                {realtimeState.messages.length} messages • Real-time
              </div>
            )}
          </div>

          {/* Current conversation during active call */}
          {isCallActive && (
            <div className="flex-1 max-h-64 overflow-y-auto space-y-2 mb-4">
              {realtimeState.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-2 rounded text-xs ${
                    message.type === 'user'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-white/10 text-white/80'
                  }`}>
                    <div className="flex items-center gap-1 mb-1">
                      {message.type === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      )}
                      <span className="font-medium">
                        {message.type === 'user' ? currentCaller : 'DONNA'}
                      </span>
                      <span className="text-white/40">• Real-time</span>
                    </div>
                    <p>{message.content}</p>
                    {message.type === 'assistant' && realtimeState.isSpeaking && (
                      <div className="flex items-center gap-1 mt-1 text-green-400">
                        <Volume2 className="w-2 h-2" />
                        <span>Speaking...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Show current transcript while speaking */}
              {realtimeState.currentTranscript && (
                <div className="flex justify-start">
                  <div className="bg-blue-500/20 text-blue-300 p-2 rounded text-xs flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
<span>&quot;{realtimeState.currentTranscript}&quot;</span>
                  </div>
                </div>
              )}

              {realtimeState.isSpeaking && !realtimeState.currentTranscript && (
                <div className="flex justify-start">
                  <div className="glass text-white/80 p-2 rounded text-xs flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span>DONNA is speaking...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call history when not in active call */}
          {!isCallActive && (
            <div className="space-y-3">
              {callHistory.slice(0, 6).map((call, idx) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 glass rounded hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      call.status === 'completed' ? 'bg-green-400' :
                      call.status === 'missed' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{call.caller}</p>
                      <p className="text-xs text-white/60">{call.time} • {call.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/80">{call.duration}</p>
                    <p className={`text-xs capitalize ${
                      call.status === "completed" ? "text-green-400" :
                      call.status === "missed" ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {call.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="glass border border-white/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isCallActive
                  ? 'bg-green-500 animate-pulse'
                  : realtimeState.isConnected
                  ? 'bg-blue-500'
                  : realtimeState.isConnecting
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {isCallActive
                  ? `Real-time call with ${currentCaller}`
                  : 'AI Receptionist Active'
                }
              </span>
            </div>
            <div className="text-sm text-white/60">
              {isCallActive
                ? `${formatTime(callDuration)} • OpenAI Realtime API`
                : realtimeState.isConnected
                ? 'Ready for real-time calls • ElevenLabs voice ready'
                : realtimeState.isConnecting
                ? 'Connecting to Realtime API...'
                : 'Realtime API disconnected'
              }
            </div>
          </div>

          {/* Error display */}
          {realtimeState.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded text-red-400 text-xs"
            >
              {realtimeState.error}
              <button
                onClick={realtimeActions.clearError}
                className="ml-2 text-red-300 hover:text-red-200"
              >
                ×
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
