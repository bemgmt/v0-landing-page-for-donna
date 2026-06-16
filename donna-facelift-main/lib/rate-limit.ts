/**
 * Memory-based rate limiting with sliding window
 * Part of WS1 Phase 1 Security Hardening
 */

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (identifier: string) => string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, { requests: number[], windowStart: number }>()

// Cleanup interval to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
let cleanupTimer: NodeJS.Timeout | null = null

/**
 * Start cleanup timer to remove expired entries
 */
function startCleanup() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    const entries = Array.from(rateLimitStore.entries())
    for (const [key, data] of entries) {
      // Remove entries older than 1 hour
      if (now - data.windowStart > 60 * 60 * 1000) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Stop cleanup timer
 */
export function stopRateLimitCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}

/**
 * Clear all rate limit data (for testing)
 */
export function clearRateLimitStore() {
  rateLimitStore.clear()
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup()

  const now = Date.now()
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier

  // Get or create entry
  let entry = rateLimitStore.get(key)
  if (!entry) {
    entry = { requests: [], windowStart: now }
    rateLimitStore.set(key, entry)
  }

  // Clean up old requests outside the window
  const windowStart = now - config.windowMs
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)

  // Check if limit exceeded
  if (entry.requests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...entry.requests)
    const resetTime = oldestRequest + config.windowMs

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime,
      error: 'Rate limit exceeded'
    }
  }

  // Add current request
  entry.requests.push(now)
  entry.windowStart = Math.min(entry.windowStart, windowStart)

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.requests.length,
    resetTime: now + config.windowMs
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  TOKEN_ISSUANCE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  },
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  AUTH: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20
  },
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
  }
} as const

/**
 * Rate limit middleware helper
 */
export function createRateLimitCheck(config: RateLimitConfig) {
  return (identifier: string) => checkRateLimit(identifier, config)
}

/**
 * Legacy helper used across API routes (async signature for compatibility)
 */
export async function rateLimit(
  identifier: string,
  bucket: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return checkRateLimit(`${bucket}:${identifier}`, {
    windowMs: windowSeconds * 1000,
    maxRequests
  })
}
