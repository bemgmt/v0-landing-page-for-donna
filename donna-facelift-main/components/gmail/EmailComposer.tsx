'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'

interface EmailComposerProps {
  onEmailSent?: (to: string, subject: string) => void
  className?: string
}

export default function EmailComposer({ onEmailSent, className }: EmailComposerProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!to.trim() || !subject.trim()) {
      setError('To and Subject fields are required')
      return
    }

    try {
      setSending(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim() || ' ' // Gmail requires some body content
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        setTo('')
        setSubject('')
        setBody('')
        onEmailSent?.(to, subject)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(data.error || 'Failed to send email')
      }
    } catch (err) {
      console.error('Error sending email:', err)
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => {
    setTo('')
    setSubject('')
    setBody('')
    setError(null)
    setSuccess(false)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Compose Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">
              To
            </label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={sending}
              required
            />
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              required
            />
          </div>
          
          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1">
              Message
            </label>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending}
              rows={6}
              className="resize-vertical"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="text-green-500 text-sm bg-green-50 p-2 rounded">
              Email sent successfully!
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={sending || !to.trim() || !subject.trim()}
              className="flex-1"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={sending}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
