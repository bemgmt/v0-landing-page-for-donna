'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, RefreshCw } from 'lucide-react'

interface EmailMessage {
  id: string
  threadId: string
  snippet: string
  subject?: string
  from?: string
  date?: string
}

interface GmailInboxListProps {
  maxMessages?: number
  className?: string
}

export default function GmailInboxList({ maxMessages = 5, className }: GmailInboxListProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/gmail/messages', { signal, cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }
      
      const data = await response.json() as { messages?: Array<{ id: string; threadId?: string; snippet?: string }> }
      
      // Gmail API returns messages with minimal info, we'd need another call for full details
      // For MVP, we'll show the basic info available
      const formattedMessages: EmailMessage[] = (data.messages || []).slice(0, maxMessages).map((msg) => ({
        id: msg.id,
        threadId: msg.threadId ?? msg.id,
        snippet: msg.snippet || 'No preview available',
        subject: 'Subject not loaded', // Would need additional API call
        from: 'Sender not loaded',
        date: undefined
      }))
      
      setMessages(formattedMessages)
    } catch (err) {
      console.error('Error fetching Gmail messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [maxMessages])

  useEffect(() => {
    const controller = new AbortController()
    fetchMessages(controller.signal)
    return () => controller.abort()
  }, [fetchMessages])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Messages
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading messages...</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm py-4 text-center">
            {error}
          </div>
        )}
        
        {!loading && !error && messages.length === 0 && (
          <div className="text-gray-500 text-sm py-4 text-center">
            No messages found
          </div>
        )}
        
        {!loading && !error && messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm truncate">{message.from}</span>
                  {message.date && <span className="text-xs text-gray-500">{message.date}</span>}
                </div>
                <div className="text-sm font-medium mb-1 truncate">{message.subject}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{message.snippet}</div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && !error && messages.length > 0 && (
          <div className="text-xs text-gray-500 text-center mt-4">Showing {messages.length} of up to {maxMessages} recent messages</div>
        )}
      </CardContent>
    </Card>
  )
}
