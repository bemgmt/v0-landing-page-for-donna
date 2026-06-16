import { NextResponse, NextRequest } from 'next/server'
import { corsHeadersFor } from '@/lib/cors'

// Returns a NextResponse.json with no-store and appropriate CORS headers.
// When security is disabled, defaults to ACAO: * for dev ergonomics unless overrideHeaders provided.
export function jsonNoStore<T>(
  req: NextRequest | undefined,
  body: T,
  options?: { status?: number; headers?: Record<string, string>; securityEnabled?: boolean }
) {
  const security = options?.securityEnabled ?? (process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true')
  const base: Record<string, string> = security && req ? corsHeadersFor(req) : { 'Access-Control-Allow-Origin': '*' }
  const headers: Record<string, string> = {
    ...base,
    ...(options?.headers || {}),
    'Cache-Control': 'no-store',
  }
  return NextResponse.json<T>(body, { status: options?.status, headers })
}

// Build only headers for no-store + CORS; useful when constructing Response options manually
export function noStoreHeaders(req: NextRequest | undefined, securityEnabled?: boolean): Record<string, string> {
  const security = securityEnabled ?? (process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true')
  const base: Record<string, string> = security && req ? corsHeadersFor(req) : { 'Access-Control-Allow-Origin': '*' }
  return { ...base, 'Cache-Control': 'no-store' }
}
