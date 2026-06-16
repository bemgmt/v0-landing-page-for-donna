'use client'

import * as Sentry from '@sentry/nextjs'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: unknown) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, errorInfo: unknown) {
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'global')
      const ctx =
        typeof errorInfo === 'object' && errorInfo !== null
          ? JSON.parse(JSON.stringify(errorInfo, (_k, v) => (typeof v === 'function' ? String(v) : v)))
          : { value: String(errorInfo) }
      scope.setContext('errorInfo', ctx as Record<string, unknown>)
      scope.setLevel('error')
      Sentry.captureException(error)
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h2 className="text-xl font-light mb-2">Something went wrong</h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-white text-black rounded"
              >
                Try again
              </button>
              <a href="/" className="px-4 py-2 bg-white/10 rounded">
                Back to home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Voice System Error Boundary
export class VoiceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, _errorInfo: unknown) {
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'voice')
      scope.setTag('component', 'VoiceProvider')
      scope.setContext('voiceState', {
        isRecording: false,
        isPlaying: false,
        connectionStatus: 'disconnected'
      })
      Sentry.captureException(error)
    })
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <h3 className="text-red-400 font-medium mb-2">Voice System Error</h3>
          <p className="text-red-300/80 text-sm mb-3">
            The voice system encountered an error. Please refresh the page.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// API Error Boundary
export class APIErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, _errorInfo: unknown) {
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'api')
      scope.setContext('apiContext', { endpoint: window.location.pathname, method: 'GET' })
      Sentry.captureException(error)
    })
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          <h3 className="text-yellow-400 font-medium mb-2">API Error</h3>
          <p className="text-yellow-300/80 text-sm mb-3">
            There was an issue connecting to the server. Please try again.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

