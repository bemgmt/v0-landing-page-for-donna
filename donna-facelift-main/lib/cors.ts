import type { NextRequest } from 'next/server'

// Returns CORS headers for actual responses based on ALLOWED_ORIGINS
export function corsHeadersFor(req: NextRequest): Record<string, string> {
  const requestOrigin = req.headers.get('origin') || ''
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const isAllowed = allowed.includes(requestOrigin)
  const headers: Record<string, string> = { Vary: 'Origin' }
  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = requestOrigin
    headers['Access-Control-Allow-Credentials'] = 'true'
  } else {
    headers['Access-Control-Allow-Origin'] = 'null'
  }
  return headers
}

// Returns headers for preflight (OPTIONS) responses; merge additional security headers per-route
export function corsPreflightHeaders(
  req: NextRequest,
  opts?: { allowMethods?: string; allowHeaders?: string; maxAge?: string }
): Record<string, string> {
  const base = corsHeadersFor(req)
  if (opts?.allowMethods) base['Access-Control-Allow-Methods'] = opts.allowMethods
  if (opts?.allowHeaders) base['Access-Control-Allow-Headers'] = opts.allowHeaders
  if (opts?.maxAge) base['Access-Control-Max-Age'] = opts.maxAge
  return base
}

