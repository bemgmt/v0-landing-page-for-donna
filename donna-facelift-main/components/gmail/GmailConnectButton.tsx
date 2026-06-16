'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface GmailConnectButtonProps {
  onConnected?: () => void
  className?: string
}

export default function GmailConnectButton({ onConnected, className }: GmailConnectButtonProps) {
  // onConnected callback is optional - OAuth flow redirects the page
  // so callback isn't called in current implementation
  void onConnected
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected')

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      // Redirect to OAuth start endpoint
      window.location.href = '/api/gmail/oauth/start'
    } catch (error) {
      console.error('Failed to start Gmail OAuth:', error)
      setConnectionStatus('error')
      setIsConnecting(false)
    }
  }

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <Mail className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      )
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            Gmail Connected
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            Connection Failed
          </>
        )
      default:
        return (
          <>
            <Mail className="h-4 w-4" />
            Connect Gmail
          </>
        )
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting || connectionStatus === 'connected'}
      variant={connectionStatus === 'error' ? 'destructive' : 'default'}
      className={className}
    >
      {getButtonContent()}
    </Button>
  )
}
