/**
 * WebSocket Health Check Utility
 * Validates WebSocket server availability before attempting connections
 */

export interface WebSocketHealthResponse {
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
  last_checked?: string
}

export interface WebSocketHealthCheckOptions {
  timeout?: number
  cache_ttl?: number
  include_features?: boolean
}

// Health check cache
const healthCheckCache = new Map<string, { data: WebSocketHealthResponse; expires: number }>()

/**
 * Validates WebSocket URL format and protocol
 */
export function validateWebSocketUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'WebSocket URL is required' }
  }

  try {
    const parsedUrl = new URL(url)
    
    if (!['ws:', 'wss:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'WebSocket URL must use ws:// or wss:// protocol' }
    }

    if (!parsedUrl.hostname) {
      return { valid: false, error: 'WebSocket URL must include a valid hostname' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid WebSocket URL format' }
  }
}

/**
 * Constructs health check URL from WebSocket URL
 */
export function getWebSocketServerUrl(websocketUrl: string): string {
  try {
    const url = new URL(websocketUrl)
    // Convert ws/wss to http/https for health check
    const protocol = url.protocol === 'wss:' ? 'https:' : 'http:'
    return `${protocol}//${url.host}/health`
  } catch (error) {
    throw new Error('Invalid WebSocket URL provided')
  }
}

/**
 * Performs comprehensive WebSocket server health check
 */
export async function checkWebSocketHealth(
  websocketUrl: string,
  options: WebSocketHealthCheckOptions = {}
): Promise<WebSocketHealthResponse> {
  const {
    timeout = 5000,
    cache_ttl = 30000, // 30 seconds
    include_features = true
  } = options

  // Validate URL format first
  const urlValidation = validateWebSocketUrl(websocketUrl)
  if (!urlValidation.valid) {
    return {
      status: 'not_configured',
      error: urlValidation.error,
      last_checked: new Date().toISOString()
    }
  }

  // Check cache first
  const cacheKey = `health_${websocketUrl}`
  const cached = healthCheckCache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    return cached.data
  }

  const startTime = Date.now()
  let healthResponse: WebSocketHealthResponse

  try {
    const healthUrl = getWebSocketServerUrl(websocketUrl)
    console.log(`[WebSocket Health] Checking server health: ${healthUrl}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DONNA-WebSocket-Health-Check'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      healthResponse = {
        status: 'unavailable',
        server_url: healthUrl,
        response_time: responseTime,
        error: `Server returned ${response.status}: ${response.statusText}`,
        last_checked: new Date().toISOString()
      }
    } else {
      let serverData: any = {}
      
      try {
        serverData = await response.json()
      } catch (parseError) {
        console.warn('[WebSocket Health] Failed to parse server response as JSON')
      }

      healthResponse = {
        status: 'available',
        server_url: healthUrl,
        response_time: responseTime,
        last_checked: new Date().toISOString()
      }

      // Include feature information if available and requested
      if (include_features && serverData) {
        healthResponse.features = {
          proxy_enabled: serverData.websocket_proxy === true,
          authentication: serverData.auth_required === true,
          rate_limiting: serverData.rate_limiting === true,
          max_connections: serverData.max_connections || undefined
        }
      }
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    if (error.name === 'AbortError') {
      healthResponse = {
        status: 'timeout',
        server_url: getWebSocketServerUrl(websocketUrl),
        response_time: responseTime,
        error: `Health check timed out after ${timeout}ms`,
        last_checked: new Date().toISOString()
      }
    } else {
      healthResponse = {
        status: 'unavailable',
        server_url: getWebSocketServerUrl(websocketUrl),
        response_time: responseTime,
        error: `Network error: ${error.message}`,
        last_checked: new Date().toISOString()
      }
    }
  }

  // Cache the result
  healthCheckCache.set(cacheKey, {
    data: healthResponse,
    expires: Date.now() + cache_ttl
  })

  console.log(`[WebSocket Health] Health check result:`, healthResponse)
  return healthResponse
}

/**
 * Clears health check cache for a specific URL or all URLs
 */
export function clearHealthCheckCache(websocketUrl?: string): void {
  if (websocketUrl) {
    const cacheKey = `health_${websocketUrl}`
    healthCheckCache.delete(cacheKey)
  } else {
    healthCheckCache.clear()
  }
}

/**
 * Gets cached health check result without performing new check
 */
export function getCachedHealthCheck(websocketUrl: string): WebSocketHealthResponse | null {
  const cacheKey = `health_${websocketUrl}`
  const cached = healthCheckCache.get(cacheKey)
  
  if (cached && Date.now() < cached.expires) {
    return cached.data
  }
  
  return null
}
