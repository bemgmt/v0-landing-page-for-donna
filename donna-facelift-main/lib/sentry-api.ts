import * as Sentry from '@sentry/nextjs'

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name: `API Call: ${options.method || 'GET'} ${endpoint}`,
    op: 'http.client'
  })

  const span = transaction.startChild({
    op: 'http.client',
    description: `${options.method || 'GET'} ${endpoint}`
  })

  try {
    const response = await fetch(endpoint, options)
    
    span.setData('http.status_code', response.status)
    span.setData('http.method', options.method || 'GET')
    span.setData('http.url', endpoint)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    span.setStatus('ok')
    return data
  } catch (error) {
    span.setStatus('internal_error')
    Sentry.captureException(error as Error, {
      tags: {
        api_endpoint: endpoint,
        api_method: options.method || 'GET'
      }
    })
    throw error
  } finally {
    span.finish()
    transaction.finish()
  }
}

export function trackPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  return Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    async (span) => {
      try {
        const result = await fn();
        span?.setStatus('ok');
        return result as T;
      } catch (error) {
        span?.setStatus('internal_error');
        throw error;
      }
    }
  ) as unknown as Promise<T>;
}

