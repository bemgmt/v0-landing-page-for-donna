import { NextResponse, NextRequest } from 'next/server'
import { corsPreflightHeaders } from '@/lib/cors'
import { jsonNoStore } from '@/lib/http'
import * as Sentry from '@sentry/nextjs'
import { authenticateRequest } from '../../../../lib/auth'
import { checkRateLimit, RATE_LIMITS } from '../../../../lib/rate-limit'
import { logSecurityEvent, generateTraceId } from '../../../../lib/security-logger'
import { validateRequestBody, COMMON_SCHEMAS } from '../../../../lib/input-validation'
import { z } from 'zod'
import { parseJson, isBadRequestError } from '@/lib/http-parse'

// Feature flag for security - can be disabled in development
const SECURITY_ENABLED = process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true'

// POST /api/realtime/token
// Returns a short-lived client_secret for connecting to OpenAI Realtime via WebRTC
export async function POST(req: NextRequest) {
  const traceId = generateTraceId()

  try {
    // If security is disabled, use simplified flow
    if (!SECURITY_ENABLED) {
      return await handleSimpleRequest(req)
    }

    // Security-enabled flow
    return await handleSecureRequest(req, traceId)
  } catch (err: unknown) {
    // Capture handled API error in Sentry for visibility
    Sentry.captureException(err)
    const errMsg = err instanceof Error ? err.message : 'Unexpected server error'
    logSecurityEvent({
      type: 'suspicious_activity',
      level: 'error',
      message: 'Unexpected error in token endpoint',
      details: { error: errMsg, traceId }
    }, traceId)

    return jsonNoStore(req, {
      error: SECURITY_ENABLED ? 'Unexpected server error' : errMsg,
      traceId
    }, { status: 500, securityEnabled: SECURITY_ENABLED })
  }
}

// Simplified request handler for development
async function handleSimpleRequest(req: NextRequest) {
  try {
    const schema = z.object({
      instructions: z.string().max(1000).optional(),
      voice: z.enum(['alloy','echo','fable','onyx','nova','shimmer']).optional(),
      model: z.string().max(100).optional(),
    })
    const { instructions, voice, model } = await parseJson(req, schema)

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return jsonNoStore(req, { error: 'Server missing OPENAI_API_KEY' }, { status: 500, securityEnabled: SECURITY_ENABLED })
    }

    // Prefer explicit model from request, then env, then sensible default
    const realtimeModel = model || process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview'

    const ac = new AbortController()
    const timeoutMs = Number(process.env.OPENAI_HTTP_TIMEOUT_MS ?? process.env.FETCH_TIMEOUT_MS) || 10000
    const to = setTimeout(() => ac.abort(), timeoutMs)
    let resp: Response
    try {
      resp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: realtimeModel,
          // These are optional; can be overridden later by session.update
          instructions: instructions || 'You are DONNA, a helpful AI receptionist. Be professional, friendly, and concise.',
          voice: voice || 'alloy'
        }
      }),
      signal: ac.signal
      })
    } finally {
      clearTimeout(to)
    }

    if (!resp.ok) {
      return jsonNoStore(req, { error: 'Failed to create client secret' }, { status: 500, securityEnabled: SECURITY_ENABLED })
    }

    const data = await resp.json()
    // Return full payload to allow clients to use additional fields if needed
    return jsonNoStore(req, { success: true, ...data }, { securityEnabled: SECURITY_ENABLED })
  } catch (err: unknown) {
    Sentry.captureException(err)
    if (isBadRequestError(err)) {
      return jsonNoStore(req, { error: err.message }, { status: 400, securityEnabled: SECURITY_ENABLED })
    }
    const errMsg = err instanceof Error ? err.message : 'Unexpected server error'
    return jsonNoStore(req, { error: errMsg }, { status: 500, securityEnabled: SECURITY_ENABLED })
  }
}

// Security-enabled request handler for production
async function handleSecureRequest(req: NextRequest, traceId: string) {
  try {
    // 1. Authentication Check
    const authResult = await authenticateRequest(req)
    if (!authResult.success) {
      logSecurityEvent({
        type: 'auth',
        level: 'warn',
        message: 'Authentication failed for token request',
        details: { error: authResult.error, traceId }
      }, traceId)

      return jsonNoStore(req, {
        success: false,
        error: 'Authentication required',
        traceId
      }, { status: 401, securityEnabled: SECURITY_ENABLED })
    }

    // 2. Rate Limiting Check
    const rateLimitResult = checkRateLimit(authResult.identifier, RATE_LIMITS.TOKEN_ISSUANCE)
    if (!rateLimitResult.success) {
      logSecurityEvent({
        type: 'rate_limit',
        level: 'warn',
        message: 'Rate limit exceeded for token request',
        details: {
          identifier: authResult.identifier,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          traceId
        }
      }, traceId)

      return jsonNoStore(req, {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.max(0, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        traceId
      }, { status: 429, securityEnabled: SECURITY_ENABLED })
    }

    // 3. Input Validation
    let body: unknown
    try {
      body = await req.json()
    } catch {
      logSecurityEvent({
        type: 'input_validation',
        level: 'warn',
        message: 'Invalid JSON in token request',
        details: { error: 'Invalid JSON', traceId }
      }, traceId)

      return jsonNoStore(req, {
        success: false,
        error: 'Invalid JSON in request body',
        traceId
      }, { status: 400, securityEnabled: SECURITY_ENABLED })
    }

    const validation = validateRequestBody(body, COMMON_SCHEMAS.TOKEN_REQUEST)
    if (!validation.valid) {
      logSecurityEvent({
        type: 'input_validation',
        level: 'warn',
        message: 'Input validation failed for token request',
        details: { errors: validation.errors, traceId }
      }, traceId)

      return jsonNoStore(req, {
        success: false,
        error: 'Input validation failed',
        details: validation.errors,
        traceId
      }, { status: 400, securityEnabled: SECURITY_ENABLED })
    }

    const { instructions, voice, model } = (validation.sanitized as any) || body

    // 4. Environment Validation
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      logSecurityEvent({
        type: 'suspicious_activity',
        level: 'critical',
        message: 'OpenAI API key not configured',
        details: { traceId }
      }, traceId)

      return jsonNoStore(req, {
        success: false,
        error: 'Service temporarily unavailable',
        traceId
      }, { status: 503, securityEnabled: SECURITY_ENABLED })
    }

    // 5. Make OpenAI Request
    const realtimeModel = model || process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17'

    const ac = new AbortController()
    const timeoutMs = Number(process.env.OPENAI_HTTP_TIMEOUT_MS ?? process.env.FETCH_TIMEOUT_MS) || 10000
    const to = setTimeout(() => ac.abort(), timeoutMs)
    let resp: Response
    try {
      resp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': `DONNA-WebApp/1.0 (TraceID: ${traceId})`
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: realtimeModel,
          instructions: instructions || 'You are DONNA, a helpful AI receptionist. Be professional, friendly, and concise.',
          voice: voice || 'alloy'
        }
      }),
      signal: ac.signal
      })
    } finally {
      clearTimeout(to)
    }

    if (!resp.ok) {
      const errText = await resp.text()
      logSecurityEvent({
        type: 'suspicious_activity',
        level: 'error',
        message: 'OpenAI API error',
        details: { status: resp.status, error: errText, traceId }
      }, traceId)

      const retry = resp.headers.get('retry-after')
      return jsonNoStore(req, { success: false, error: 'Token generation failed', traceId }, {
        status: resp.status === 429 ? 503 : 502,
        headers: retry ? { 'Retry-After': retry } : undefined,
        securityEnabled: SECURITY_ENABLED,
      })
    }

    const data = await resp.json()

    // Log successful token issuance
    logSecurityEvent({
      type: 'auth',
      level: 'info',
      message: 'Token issued successfully',
      details: {
        userId: authResult.user?.userId,
        model: realtimeModel,
        hasCustomInstructions: !!instructions,
        hasCustomVoice: !!voice,
        traceId
      }
    }, traceId)

    return jsonNoStore(req, {
      success: true,
      traceId,
      ...data
    }, { securityEnabled: SECURITY_ENABLED })

  } catch (error: unknown) {
    Sentry.captureException(error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logSecurityEvent({
      type: 'suspicious_activity',
      level: 'error',
      message: 'Unexpected error in secure token request',
      details: { error: errMsg, traceId }
    }, traceId)

    return jsonNoStore(req, {
      success: false,
      error: 'Internal server error',
      traceId
    }, { status: 500, securityEnabled: SECURITY_ENABLED })
  }
}

export async function OPTIONS(req: NextRequest) {
  if (SECURITY_ENABLED) {
    // Security-enabled OPTIONS handling
    const traceId = generateTraceId()

    logSecurityEvent({
      type: 'auth',
      level: 'info',
      message: 'CORS preflight request',
      details: {
        origin: req.headers.get('origin'),
        traceId
      }
    }, traceId)

    const headers: Record<string, string> = {
      ...corsPreflightHeaders(req, {
        allowMethods: 'POST, OPTIONS',
        allowHeaders: 'Content-Type, Authorization, X-Requested-With',
        maxAge: '86400',
      }),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    }
    return new NextResponse(null, { status: 204, headers })
  }

  // Simple OPTIONS for development: allow all origins (no credentials)
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  })
}

// CORS helpers are imported from lib/cors
