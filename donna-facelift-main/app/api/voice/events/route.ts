import { NextResponse, NextRequest } from 'next/server'
import { corsPreflightHeaders } from '@/lib/cors'
import { jsonNoStore } from '@/lib/http'
import * as Sentry from '@sentry/nextjs'
import { checkRateLimit, RATE_LIMITS } from '../../../../lib/rate-limit'
import { logSecurityEvent, generateTraceId } from '../../../../lib/security-logger'

// Feature flag for security - can be disabled in development
const SECURITY_ENABLED = process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true'

// Simple fan-out endpoint so the VoiceProvider can log to various backends
// Later we can enhance this to write to DB, Kafka, or forward to PHP services
export async function POST(req: NextRequest) {
  const traceId = generateTraceId()

  try {
    // Apply security if enabled
    if (SECURITY_ENABLED) {
      // Basic rate limiting for voice events
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
              || req.headers.get('cf-connecting-ip')
              || req.headers.get('x-real-ip')
              || req.ip
              || ''
      const ua = req.headers.get('user-agent') || ''
      const identifier = ip ? `ip:${ip}` : `ua:${ua.slice(0,64) || 'unknown'}`

      const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.API_GENERAL)
      if (!rateLimitResult.success) {
        logSecurityEvent({
          type: 'rate_limit',
          level: 'warn',
          message: 'Rate limit exceeded for voice events',
          details: { identifier, traceId }
        }, traceId)

        return jsonNoStore(req, { ok: false, error: 'Rate limit exceeded', traceId }, { status: 429, securityEnabled: SECURITY_ENABLED })
      }
    }

    const event: unknown = await req.json()

    // Basic input validation
    if (!event || typeof event !== 'object') {
      if (SECURITY_ENABLED) {
        logSecurityEvent({
          type: 'input_validation',
          level: 'warn',
          message: 'Invalid event data in voice events',
          details: { traceId }
        }, traceId)
      }
      return jsonNoStore(req, { ok: false, error: 'Invalid event data' }, { status: 400, securityEnabled: SECURITY_ENABLED })
    }

    // Build absolute URL using the current request origin
    const origin = req.nextUrl.origin
    const url = `${origin}/api/voice/fanout`

    // Fan-out internally to a second endpoint that calls the PHP stubs
    try {
      const ac = new AbortController()
      const to = setTimeout(() => ac.abort(), 5000)
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-ID': traceId
        },
        body: JSON.stringify(event),
        signal: ac.signal,
      }).finally(() => clearTimeout(to))
    } catch (error) {
      // Log but don't fail the request
      if (SECURITY_ENABLED) {
        logSecurityEvent({
          type: 'suspicious_activity',
          level: 'warn',
          message: 'Voice fanout failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error', traceId }
        }, traceId)
      }
    }

    return jsonNoStore(req, { ok: true, traceId: SECURITY_ENABLED ? traceId : undefined }, { securityEnabled: SECURITY_ENABLED })
  } catch (err: unknown) {
    Sentry.withScope(scope => {
      scope.setTag('route', '/api/voice/events')
      scope.setTag('traceId', traceId)
      Sentry.captureException(err)
    })
    const errMsg = err instanceof Error ? err.message : 'bad request'
    if (SECURITY_ENABLED) {
      logSecurityEvent({
        type: 'suspicious_activity',
        level: 'error',
        message: 'Error in voice events endpoint',
        details: { error: errMsg, traceId }
      }, traceId)
    }

    return jsonNoStore(req, { ok: false, error: SECURITY_ENABLED ? 'bad request' : errMsg, traceId: SECURITY_ENABLED ? traceId : undefined }, { status: 400, securityEnabled: SECURITY_ENABLED })
  }
}

export async function OPTIONS(req: NextRequest) {
  if (SECURITY_ENABLED) {
    const traceId = generateTraceId()
    logSecurityEvent({
      type: 'auth',
      level: 'info',
      message: 'CORS preflight for voice events',
      details: { origin: req.headers.get('origin'), traceId }
    }, traceId)

    const headers: Record<string, string> = {
      ...corsPreflightHeaders(req, {
        allowMethods: 'POST, OPTIONS',
        allowHeaders: 'Content-Type, X-Trace-ID',
      }),
      'X-Content-Type-Options': 'nosniff',
    }
    return new NextResponse(null, { status: 204, headers })
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Trace-ID',
      'Access-Control-Max-Age': '86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

// CORS helpers are shared in lib/cors
