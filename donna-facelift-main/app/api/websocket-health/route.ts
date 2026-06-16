/**
 * WebSocket Health Check API Endpoint
 * Dedicated endpoint for validating WebSocket server availability
 */

import { NextRequest, NextResponse } from 'next/server'

interface WebSocketHealthResponse {
  status: 'available' | 'unavailable' | 'timeout' | 'not_configured'
  server_url?: string
  features?: {
    proxy_enabled?: boolean
    authentication?: boolean
    rate_limiting?: boolean
    max_connections?: number
  }
  response_time?: number
  error?: string
  last_checked: string
}

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute per IP

// Health check cache
const healthCache = new Map<string, { data: WebSocketHealthResponse; expires: number }>()
const CACHE_TTL = 30000 // 30 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = `rate_limit_${ip}`
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

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

async function performWebSocketHealthCheck(websocketUrl: string): Promise<WebSocketHealthResponse> {
  const startTime = Date.now()
  
  try {
    // Convert WebSocket URL to HTTP health check URL
    const url = new URL(websocketUrl)
    const protocol = url.protocol === 'wss:' ? 'https:' : 'http:'
    const healthUrl = `${protocol}//${url.host}/health`

    console.log(`[WebSocket Health API] Checking: ${healthUrl}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DONNA-WebSocket-Health-API'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        status: 'unavailable',
        server_url: healthUrl,
        response_time: responseTime,
        error: `Server returned ${response.status}: ${response.statusText}`,
        last_checked: new Date().toISOString()
      }
    }

    let serverData: any = {}
    try {
      serverData = await response.json()
    } catch (parseError) {
      console.warn('[WebSocket Health API] Failed to parse server response')
    }

    return {
      status: 'available',
      server_url: healthUrl,
      response_time: responseTime,
      features: {
        proxy_enabled: serverData.websocket_proxy === true,
        authentication: serverData.auth_required === true,
        rate_limiting: serverData.rate_limiting === true,
        max_connections: serverData.max_connections || undefined
      },
      last_checked: new Date().toISOString()
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        response_time: responseTime,
        error: 'Health check timed out after 5 seconds',
        last_checked: new Date().toISOString()
      }
    }

    return {
      status: 'unavailable',
      response_time: responseTime,
      error: `Network error: ${error.message}`,
      last_checked: new Date().toISOString()
    }
  }
}

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  // Check rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString()
        }
      }
    )
  }

  try {
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    
    if (!websocketUrl) {
      return NextResponse.json({
        status: 'not_configured',
        error: 'NEXT_PUBLIC_WEBSOCKET_URL environment variable is not configured',
        last_checked: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // Check cache first
    const cacheKey = `websocket_health_${websocketUrl}`
    const cached = healthCache.get(cacheKey)
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `public, max-age=${Math.ceil((cached.expires - Date.now()) / 1000)}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // Perform health check
    const healthResult = await performWebSocketHealthCheck(websocketUrl)
    
    // Cache the result
    healthCache.set(cacheKey, {
      data: healthResult,
      expires: Date.now() + CACHE_TTL
    })

    return NextResponse.json(healthResult, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error: any) {
    console.error('[WebSocket Health API] Error:', error)
    
    return NextResponse.json({
      status: 'unavailable',
      error: `Health check failed: ${error.message}`,
      last_checked: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}
