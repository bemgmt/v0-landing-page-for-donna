/**
 * WebSocket Fallback Manager
 * Provides alternative communication methods when WebSocket server is unavailable
 */

export interface FallbackMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface FallbackConfig {
  polling_interval?: number // milliseconds
  max_poll_duration?: number // milliseconds
  max_retries?: number
  enable_notifications?: boolean
}

export interface FallbackStatus {
  active: boolean
  mode: 'polling' | 'http_only' | 'disabled'
  last_poll?: string
  next_poll?: string
  limitations: string[]
}

export class WebSocketFallbackManager {
  private config: Required<FallbackConfig>
  private isActive = false
  private pollingInterval: NodeJS.Timeout | null = null
  private messageQueue: FallbackMessage[] = []
  private lastMessageId = ''
  private onMessageCallback?: (message: FallbackMessage) => void
  private onStatusChangeCallback?: (status: FallbackStatus) => void

  constructor(config: FallbackConfig = {}) {
    this.config = {
      polling_interval: config.polling_interval || 3000, // 3 seconds
      max_poll_duration: config.max_poll_duration || 300000, // 5 minutes
      max_retries: config.max_retries || 3,
      enable_notifications: config.enable_notifications ?? true
    }
  }

  /**
   * Starts fallback mode with polling-based communication
   */
  public startPollingFallback(): void {
    if (this.isActive) {
      console.log('[WebSocket Fallback] Already active')
      return
    }

    console.log('[WebSocket Fallback] Starting polling fallback mode')
    this.isActive = true
    
    // Notify user about fallback mode
    if (this.config.enable_notifications) {
      this.notifyFallbackActive()
    }

    // Start polling for new messages
    this.startPolling()
    
    // Update status
    this.updateStatus()
  }

  /**
   * Stops fallback mode and cleans up resources
   */
  public stopFallback(): void {
    console.log('[WebSocket Fallback] Stopping fallback mode')
    this.isActive = false
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    this.updateStatus()
  }

  /**
   * Sends a message via HTTP API when WebSocket is unavailable
   */
  public async sendMessageViaFallback(message: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isActive) {
      return { success: false, error: 'Fallback mode not active' }
    }

    try {
      console.log('[WebSocket Fallback] Sending message via HTTP API')
      
      const response = await fetch('/api/chat/fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          session_id: this.getSessionId(),
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Add user message to queue
      const userMessage: FallbackMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
      
      this.messageQueue.push(userMessage)
      this.onMessageCallback?.(userMessage)

      // Add assistant response if available
      if (result.response) {
        const assistantMessage: FallbackMessage = {
          id: result.id || `assistant_${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: result.timestamp || new Date().toISOString()
        }
        
        this.messageQueue.push(assistantMessage)
        this.onMessageCallback?.(assistantMessage)
      }

      return { success: true }

    } catch (error: any) {
      console.error('[WebSocket Fallback] Failed to send message:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Checks if WebSocket server has become available again
   */
  public async checkWebSocketAvailability(): Promise<boolean> {
    try {
      const response = await fetch('/api/websocket-health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) {
        return false
      }

      const health = await response.json()
      return health.status === 'available'

    } catch (error) {
      console.error('[WebSocket Fallback] Failed to check WebSocket availability:', error)
      return false
    }
  }

  /**
   * Sets callback for receiving new messages
   */
  public onMessage(callback: (message: FallbackMessage) => void): void {
    this.onMessageCallback = callback
  }

  /**
   * Sets callback for status changes
   */
  public onStatusChange(callback: (status: FallbackStatus) => void): void {
    this.onStatusChangeCallback = callback
  }

  /**
   * Gets current fallback status
   */
  public getStatus(): FallbackStatus {
    return {
      active: this.isActive,
      mode: this.isActive ? 'polling' : 'disabled',
      last_poll: this.lastMessageId ? new Date().toISOString() : undefined,
      next_poll: this.pollingInterval ? new Date(Date.now() + this.config.polling_interval).toISOString() : undefined,
      limitations: [
        'Real-time features disabled',
        'Voice input/output unavailable',
        'Delayed message delivery',
        'Limited to text-only communication'
      ]
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        // Check if WebSocket server is available again
        const isAvailable = await this.checkWebSocketAvailability()
        
        if (isAvailable) {
          console.log('[WebSocket Fallback] WebSocket server is available again')
          this.stopFallback()
          
          // Notify about transition back to WebSocket
          if (this.config.enable_notifications) {
            this.notifyWebSocketRestored()
          }
          
          return
        }

        // Poll for new messages (if we had a chat API endpoint for this)
        // This would typically poll a REST endpoint for new messages
        // For now, we'll just update the status
        this.updateStatus()

      } catch (error) {
        console.error('[WebSocket Fallback] Polling error:', error)
      }
    }, this.config.polling_interval)

    // Stop polling after max duration
    setTimeout(() => {
      if (this.pollingInterval) {
        console.log('[WebSocket Fallback] Max poll duration reached, stopping')
        this.stopFallback()
      }
    }, this.config.max_poll_duration)
  }

  private updateStatus(): void {
    const status = this.getStatus()
    this.onStatusChangeCallback?.(status)
  }

  private notifyFallbackActive(): void {
    console.warn('[WebSocket Fallback] Fallback mode active - real-time features limited')
    
    // You could show a toast notification here
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('DONNA - Limited Mode', {
          body: 'WebSocket connection unavailable. Using fallback mode with limited features.',
          icon: '/favicon.ico'
        })
      }
    }
  }

  private notifyWebSocketRestored(): void {
    console.log('[WebSocket Fallback] WebSocket connection restored')
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('DONNA - Connection Restored', {
          body: 'WebSocket connection restored. All features are now available.',
          icon: '/favicon.ico'
        })
      }
    }
  }

  private getSessionId(): string {
    // Generate or retrieve session ID for fallback communication
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('donna_fallback_session')
      if (!sessionId) {
        sessionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('donna_fallback_session', sessionId)
      }
      return sessionId
    }
    return `fallback_${Date.now()}`
  }
}
