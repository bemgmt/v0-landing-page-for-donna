import { NextResponse, NextRequest } from 'next/server'
import { corsHeadersFor, corsPreflightHeaders } from '@/lib/cors'
import { jsonNoStore } from '@/lib/http'
import * as Sentry from '@sentry/nextjs'
import { checkRateLimit, RATE_LIMITS } from '../../../../lib/rate-limit'
import { logSecurityEvent, generateTraceId } from '../../../../lib/security-logger'

// Feature flag for security - can be disabled in development
const SECURITY_ENABLED = process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true'

// Very simple fan-out to existing PHP stubs so the rest of the grid can consume
export async function POST(req: NextRequest) {
  const traceId = generateTraceId()

  try {
    // Apply security if enabled
    if (SECURITY_ENABLED) {
      // Basic rate limiting for fanout
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
          message: 'Rate limit exceeded for voice fanout',
          details: { identifier, traceId }
        }, traceId)

        return jsonNoStore(req, { ok: false, error: 'Rate limit exceeded', traceId }, { status: 429, securityEnabled: SECURITY_ENABLED })
      }
    }

    const payload: unknown = await req.json()

    // Basic input validation
    if (!payload || typeof payload !== 'object') {
      if (SECURITY_ENABLED) {
        logSecurityEvent({
          type: 'input_validation',
          level: 'warn',
          message: 'Invalid payload in voice fanout',
          details: { traceId }
        }, traceId)
      }
      return jsonNoStore(req, { ok: false, error: 'Invalid payload' }, { status: 400, securityEnabled: SECURITY_ENABLED })
    }

    // Prefer explicit base API; otherwise infer from request origin in local dev
    const phpBase = process.env.PHP_API_BASE
      || (process.env.NODE_ENV !== 'production' ? `${req.nextUrl.origin}/donna` : '')

    if (!phpBase) {
      // If we still can't resolve a base, return ok but note that fan-out is disabled.
      return jsonNoStore(req, {
        ok: true,
        note: 'No PHP base configured; fan-out disabled',
        traceId: SECURITY_ENABLED ? traceId : undefined
      }, { securityEnabled: SECURITY_ENABLED })
    }

    // Marketing example: increment or log (background)
    setTimeout(() => {
      const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 3000)
      fetch(`${phpBase}/api/marketing.php`, {
        method: 'GET',
        headers: SECURITY_ENABLED ? { 'X-Trace-ID': traceId } : {},
        signal: ac.signal
      }).catch(() => {}).finally(() => clearTimeout(to))
    }, 0)

    // Sales example: POST action to overview stub (background)
    setTimeout(() => {
      const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 3000)
      fetch(`${phpBase}/api/sales/overview.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SECURITY_ENABLED ? { 'X-Trace-ID': traceId } : {})
        },
        body: JSON.stringify({ action: 'voice_event', payload }),
        signal: ac.signal
      }).catch(() => {}).finally(() => clearTimeout(to))
    }, 0)

    // Secretary example: dashboard ping (background)
    setTimeout(() => {
      const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 3000)
      fetch(`${phpBase}/api/secretary/dashboard.php`, {
        method: 'GET',
        headers: SECURITY_ENABLED ? { 'X-Trace-ID': traceId } : {},
        signal: ac.signal
      }).catch(() => {}).finally(() => clearTimeout(to))
    }, 0)

    return jsonNoStore(req, { ok: true, traceId: SECURITY_ENABLED ? traceId : undefined }, { securityEnabled: SECURITY_ENABLED })
  } catch (e: unknown) {
    Sentry.captureException(e, { tags: { endpoint: 'voice-fanout', security: String(SECURITY_ENABLED) }, extra: { traceId } })
    const errMsg = e instanceof Error ? e.message : 'bad request'
    if (SECURITY_ENABLED) {
      logSecurityEvent({
        type: 'suspicious_activity',
        level: 'error',
        message: 'Error in voice fanout endpoint',
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
      message: 'CORS preflight for voice fanout',
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

  // Development: permissive preflight to avoid blocked browser requests
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
