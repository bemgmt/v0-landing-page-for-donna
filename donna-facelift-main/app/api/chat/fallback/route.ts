/**
 * Chat Fallback API Endpoint
 * Provides HTTP-based chat functionality when WebSocket is unavailable
 */

import { NextRequest, NextResponse } from 'next/server'

interface FallbackChatRequest {
  message: string
  session_id: string
  timestamp: string
}

interface FallbackChatResponse {
  id: string
  response: string
  timestamp: string
  session_id: string
  mode: 'fallback'
  limitations: string[]
}

// Simple in-memory session storage for fallback mode
const fallbackSessions = new Map<string, {
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
  created_at: string
  last_activity: string
}>()

// Rate limiting for fallback API
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per session

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now()
  const key = `fallback_rate_${sessionId}`
  const existing = rateLimitCache.get(key)

  if (!existing || now > existing.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  existing.count++
  return true
}

function getOrCreateSession(sessionId: string) {
  if (!fallbackSessions.has(sessionId)) {
    fallbackSessions.set(sessionId, {
      messages: [],
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    })
  }
  
  const session = fallbackSessions.get(sessionId)!
  session.last_activity = new Date().toISOString()
  return session
}

function generateFallbackResponse(message: string): string {
  // Simple fallback responses - in a real implementation, this would
  // integrate with your AI service or provide more sophisticated responses
  const responses = [
    "I'm currently running in limited mode due to WebSocket connectivity issues. My responses may be delayed.",
    "I understand your message, but I'm operating with reduced functionality right now. Please try again when the connection is restored.",
    "Thank you for your message. I'm experiencing connectivity issues and can only provide basic responses at the moment.",
    "I received your message but I'm in fallback mode with limited capabilities. Real-time features are temporarily unavailable.",
    "Your message has been received. I'm currently unable to provide full assistance due to connection limitations."
  ]
  
  // Simple keyword-based responses
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return "I'm here to help, but I'm currently in limited mode. For full assistance, please wait for the WebSocket connection to be restored."
  }
  
  if (lowerMessage.includes('status') || lowerMessage.includes('connection')) {
    return "I'm currently operating in fallback mode due to WebSocket server unavailability. Some features may be limited."
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm DONNA, but I'm currently running in limited mode. How can I assist you today?"
  }
  
  // Return a random fallback response
  return responses[Math.floor(Math.random() * responses.length)]
}

export async function POST(request: NextRequest) {
  try {
    const body: FallbackChatRequest = await request.json()
    
    if (!body.message || !body.session_id) {
      return NextResponse.json(
        { error: 'Message and session_id are required' },
        { status: 400 }
      )
    }

    // Check rate limiting
    if (!checkRateLimit(body.session_id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down your requests.' },
        { status: 429 }
      )
    }

    // Get or create session
    const session = getOrCreateSession(body.session_id)
    
    // Add user message to session
    session.messages.push({
      role: 'user',
      content: body.message,
      timestamp: body.timestamp
    })

    // Generate fallback response
    const responseText = generateFallbackResponse(body.message)
    const responseId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const responseTimestamp = new Date().toISOString()

    // Add assistant response to session
    session.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: responseTimestamp
    })

    // Clean up old sessions (keep only last 100 messages per session)
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-100)
    }

    const response: FallbackChatResponse = {
      id: responseId,
      response: responseText,
      timestamp: responseTimestamp,
      session_id: body.session_id,
      mode: 'fallback',
      limitations: [
        'Real-time features disabled',
        'Voice input/output unavailable',
        'Limited AI capabilities',
        'Delayed responses'
      ]
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error: any) {
    console.error('[Fallback Chat API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process fallback chat request',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}

// Clean up old sessions periodically (in a real app, this would be a background job)
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  const sessionsToDelete: string[] = []
  fallbackSessions.forEach((session, sessionId) => {
    const lastActivity = new Date(session.last_activity).getTime()
    if (now - lastActivity > maxAge) {
      sessionsToDelete.push(sessionId)
    }
  })

  sessionsToDelete.forEach(sessionId => {
    fallbackSessions.delete(sessionId)
  })
}, 60 * 60 * 1000) // Run every hour
