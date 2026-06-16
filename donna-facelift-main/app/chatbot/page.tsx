"use client"

import ChatbotControlInterface from "@/components/interfaces/chatbot-control-interface"
import { VoiceProvider } from "@/components/voice/VoiceProvider"
import VoicePanel from "@/components/voice/VoicePanel"

export default function ChatbotPage() {
  return (
    <VoiceProvider>
      <div className="space-y-6">
        <ChatbotControlInterface />
        <VoicePanel />
      </div>
    </VoiceProvider>
  )
}
