import { useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'

export function useSentry() {
  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
      }
      scope.setLevel('error')
      Sentry.captureException(error)
    })
  }, [])

  const captureMessage = useCallback((message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level)
  }, [])

  const setUser = useCallback((user: { id?: string; email?: string; username?: string }) => {
    Sentry.setUser(user)
  }, [])

  const addBreadcrumb = useCallback((breadcrumb: {
    message: string
    category?: string
    level?: 'info' | 'warning' | 'error'
    data?: Record<string, any>
  }) => {
    Sentry.addBreadcrumb(breadcrumb)
  }, [])

  const startTransaction = useCallback((name: string, op: string) => {
    return Sentry.startTransaction({ name, op })
  }, [])

  return {
    captureError,
    captureMessage,
    setUser,
    addBreadcrumb,
    startTransaction
  }
}

export function useAPIErrorTracking() {
  const { captureError, addBreadcrumb } = useSentry()

  const trackAPIError = useCallback((
    error: Error,
    endpoint: string,
    method: string,
    requestData?: any,
    responseData?: any
  ) => {
    addBreadcrumb({
      message: `API Error: ${method} ${endpoint}`,
      category: 'api',
      level: 'error',
      data: { endpoint, method, requestData, responseData }
    })

    captureError(error, {
      api: {
        endpoint,
        method,
        requestData,
        responseData,
        timestamp: new Date().toISOString()
      }
    })
  }, [captureError, addBreadcrumb])

  return { trackAPIError }
}

