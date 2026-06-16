import { auth } from '@/lib/preview-auth'
import { NextRequest } from 'next/server'

/**
 * Authentication utilities for API route security
 * Part of WS1 Phase 1 Security Hardening
 */

export interface AuthenticatedUser {
  userId: string
  sessionId: string
  orgId?: string
}

/**
 * Verify authentication using demo session (cookie-based)
 */
export async function verifyAuthentication(): Promise<{
  success: boolean
  user?: AuthenticatedUser
  error?: string
}> {
  try {
    const { userId, sessionId, orgId } = await auth()

    if (!userId || !sessionId) {
      return {
        success: false,
        error: 'No valid authentication found'
      }
    }

    return {
      success: true,
      user: {
        userId,
        sessionId,
        orgId: orgId || undefined
      }
    }
  } catch (error) {
    console.error('Authentication verification failed:', error)
    return {
      success: false,
      error: 'Authentication verification failed'
    }
  }
}

/**
 * Extract authentication from request headers
 * Fallback for cases where session auth isn't available
 */
export async function extractAuthFromHeaders(request: NextRequest): Promise<{
  success: boolean
  token?: string
  error?: string
}> {
  try {
    const authorization = request.headers.get('authorization')

    if (!authorization) {
      return {
        success: false,
        error: 'No authorization header found'
      }
    }

    // Support both "Bearer token" and "token" formats
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : authorization

    if (!token) {
      return {
        success: false,
        error: 'Invalid authorization header format'
      }
    }

    return {
      success: true,
      token
    }
  } catch (error) {
    console.error('Header extraction failed:', error)
    return {
      success: false,
      error: 'Failed to extract authentication from headers'
    }
  }
}

/**
 * Validate JWT token (for direct token-based auth)
 * Note: This is a simplified implementation. In production, use proper JWT validation
 */
export function validateJwtToken(token: string): {
  success: boolean
  payload?: unknown
  error?: string
} {
  const JWT_SECRET = process.env.JWT_SECRET

  if (!JWT_SECRET) {
    return {
      success: false,
      error: 'JWT_SECRET not configured'
    }
  }

  try {
    // Simple token validation - in production, use proper JWT library
    // This is a placeholder for demonstration
    const parts = token.split('.')
    if (parts.length !== 3) {
      return {
        success: false,
        error: 'Invalid JWT format'
      }
    }

    // For now, just check if token exists and has proper structure
    // In production, implement proper JWT verification with signature validation
    return {
      success: true,
      payload: { token }
    }
  } catch {
    return {
      success: false,
      error: 'JWT validation failed'
    }
  }
}

/**
 * Get user identifier for rate limiting
 * Prefers user ID, falls back to IP address
 */
export function getUserIdentifier(user?: AuthenticatedUser, request?: NextRequest): string {
  if (user?.userId) {
    return `user:${user.userId}`
  }

  if (request) {
    // Try to get real IP from headers (for deployments behind proxies)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown'
    return `ip:${ip}`
  }

  return 'anonymous'
}

/**
 * Comprehensive authentication check for API routes
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  user?: AuthenticatedUser
  identifier: string
  error?: string
}> {
  const sessionAuth = await verifyAuthentication()

  if (sessionAuth.success && sessionAuth.user) {
    return {
      success: true,
      user: sessionAuth.user,
      identifier: getUserIdentifier(sessionAuth.user, request)
    }
  }

  // Fallback to header-based auth
  const headerAuth = await extractAuthFromHeaders(request)

  if (headerAuth.success && headerAuth.token) {
    const jwtValidation = validateJwtToken(headerAuth.token)

    if (jwtValidation.success) {
      // Create minimal user object from JWT
      const user: AuthenticatedUser = {
        userId: `jwt:${headerAuth.token.slice(0, 8)}`,
        sessionId: 'jwt-session'
      }

      return {
        success: true,
        user,
        identifier: getUserIdentifier(user, request)
      }
    }
  }

  // No valid authentication found
  return {
    success: false,
    identifier: getUserIdentifier(undefined, request),
    error: sessionAuth.error || headerAuth.error || 'No valid authentication found'
  }
}
