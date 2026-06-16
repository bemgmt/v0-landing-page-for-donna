"use client"
export const dynamic = 'force-dynamic'

import GmailConnectButton from '@/components/gmail/GmailConnectButton'
import GmailInboxList from '@/components/gmail/GmailInboxList'
import EmailComposer from '@/components/gmail/EmailComposer'
import VoiceControls from '@/components/voice/VoiceControls'

export default function DemoPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          DONNA MVP Components Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gmail Integration Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">
              Gmail Integration
            </h2>
            
            <div className="glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Connect Gmail</h3>
              <GmailConnectButton 
                onConnected={() => console.log('Gmail connected!')}
                className="w-full"
              />
            </div>
            
            <GmailInboxList className="shadow" />
            
            <EmailComposer 
              onEmailSent={(to, subject) => 
                console.log(`Email sent to ${to}: ${subject}`)
              }
              className="shadow"
            />
          </div>
          
          {/* Voice Controls Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">
              Voice Controls
            </h2>
            
            <VoiceControls className="shadow" />
            
            <div className="glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4 text-white">Usage Instructions</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Click &quot;Start Call&quot; to begin a real-time voice session</li>
                <li>• Speak naturally - DONNA will listen and respond</li>
                <li>• Use the mic and speaker buttons to control audio</li>
                <li>• Click &quot;End Call&quot; to terminate the session</li>
              </ul>
            </div>
            
            <div className="glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4 text-white">Gmail Instructions</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Click &quot;Connect Gmail&quot; to start OAuth flow</li>
                <li>• Grant permissions to read and send emails</li>
                <li>• View recent messages in the inbox list</li>
                <li>• Compose and send emails through Gmail API</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 glass p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-2">MVP Status</h3>
          <p className="text-white/80 text-sm">
            These components are ready for MVP deployment.             They integrate with the existing 
            Supabase database, demo authentication, and provide the core functionality
            specified in the PRD-MVP.md document.
          </p>
        </div>
      </div>
    </div>
  )
}
