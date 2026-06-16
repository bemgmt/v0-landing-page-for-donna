/**
 * Security event logging utilities
 * Part of WS1 Phase 1 Security Hardening
 */

export interface SecurityEvent {
  type: 'auth' | 'rate_limit' | 'input_validation' | 'access_denied' | 'suspicious_activity'
  level: 'info' | 'warn' | 'error' | 'critical'
  message: string
  details?: Record<string, unknown>
  userId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  timestamp: string
  traceId: string
}

/**
 * Generate a unique trace ID for request tracking
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log security events with structured data
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'traceId'>, traceId?: string): void {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    traceId: traceId || generateTraceId()
  }

  // In development, log to console with formatting
  if (process.env.NODE_ENV === 'development') {
    const prefix = `[SECURITY:${event.level.toUpperCase()}]`
    const message = `${prefix} ${event.type}: ${event.message}`
    
    switch (event.level) {
      case 'critical':
      case 'error':
        console.error(message, securityEvent.details || '')
        break
      case 'warn':
        console.warn(message, securityEvent.details || '')
        break
      default:
        console.log(message, securityEvent.details || '')
    }
    return
  }

  // In production, use structured logging
  console.log(JSON.stringify(securityEvent))
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  success: boolean,
  details: {
    userId?: string
    ip?: string
    userAgent?: string
    endpoint?: string
    method?: string
    error?: string
  },
  traceId?: string
): void {
  logSecurityEvent({
    type: 'auth',
    level: success ? 'info' : 'warn',
    message: success ? 'Authentication successful' : 'Authentication failed',
    details: {
      success,
      ...details
    },
    userId: details.userId,
    ip: details.ip,
    userAgent: details.userAgent,
    endpoint: details.endpoint
  }, traceId)
}

/**
 * Log rate limiting events
 */
export function logRateLimitEvent(
  blocked: boolean,
  details: {
    identifier: string
    limit: number
    remaining: number
    resetTime: number
    endpoint?: string
    ip?: string
  },
  traceId?: string
): void {
  logSecurityEvent({
    type: 'rate_limit',
    level: blocked ? 'warn' : 'info',
    message: blocked ? 'Rate limit exceeded' : 'Rate limit check passed',
    details: {
      blocked,
      ...details
    },
    ip: details.ip,
    endpoint: details.endpoint
  }, traceId)
}

/**
 * Log input validation events
 */
export function logInputValidationEvent(
  valid: boolean,
  details: {
    field?: string
    value?: string
    rule?: string
    endpoint?: string
    ip?: string
    userId?: string
    error?: string
  },
  traceId?: string
): void {
  logSecurityEvent({
    type: 'input_validation',
    level: valid ? 'info' : 'warn',
    message: valid ? 'Input validation passed' : 'Input validation failed',
    details: {
      valid,
      ...details,
      // Sanitize sensitive data
      value: details.value ? '[REDACTED]' : undefined
    },
    userId: details.userId,
    ip: details.ip,
    endpoint: details.endpoint
  }, traceId)
}

/**
 * Log access denied events
 */
export function logAccessDeniedEvent(
  details: {
    reason: string
    endpoint?: string
    ip?: string
    userId?: string
    userAgent?: string
    method?: string
  },
  traceId?: string
): void {
  logSecurityEvent({
    type: 'access_denied',
    level: 'warn',
    message: 'Access denied',
    details,
    userId: details.userId,
    ip: details.ip,
    userAgent: details.userAgent,
    endpoint: details.endpoint
  }, traceId)
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  details: {
    activity: string
    severity: 'low' | 'medium' | 'high'
    endpoint?: string
    ip?: string
    userId?: string
    userAgent?: string
    metadata?: Record<string, unknown>
  },
  traceId?: string
): void {
  logSecurityEvent({
    type: 'suspicious_activity',
    level: details.severity === 'high' ? 'critical' : details.severity === 'medium' ? 'error' : 'warn',
    message: `Suspicious activity detected: ${details.activity}`,
    details: {
      ...details,
      metadata: details.metadata
    },
    userId: details.userId,
    ip: details.ip,
    userAgent: details.userAgent,
    endpoint: details.endpoint
  }, traceId)
}
