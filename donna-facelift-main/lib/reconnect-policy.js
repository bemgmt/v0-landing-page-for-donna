export function computeNextDelay(attempt, baseMs = 500, capMs = 5000, jitterMs = 250) {
  const expo = Math.min(capMs, baseMs * Math.pow(2, Math.max(0, attempt - 1)))
  const jitter = Math.floor(Math.random() * jitterMs)
  return expo + jitter
}

/**
 * Determines if a retry should be attempted based on the error, current attempts, and max attempts
 * @param {any} error - The error that occurred (WebSocket close event, Error object, etc.)
 * @param {number} currentAttempts - Current number of retry attempts
 * @param {number} maxAttempts - Maximum number of retry attempts allowed
 * @returns {boolean} - Whether to retry
 */
export function shouldRetry(error, currentAttempts, maxAttempts) {
  // Don't retry if we've exceeded max attempts
  if (currentAttempts >= maxAttempts) {
    return false
  }

  // For WebSocket close events, check the close code
  if (error && typeof error === 'object' && 'code' in error) {
    const closeCode = error.code
    // Don't retry for normal closure or policy violations
    if (closeCode === 1000 || closeCode === 1001 || closeCode === 1002 || closeCode === 1003) {
      return false
    }
    // Retry for abnormal closures, going away, protocol errors, etc.
    return true
  }

  // For Error objects, check if it's retriable
  if (error instanceof Error) {
    return isRetriableError(error)
  }

  // Default to retry for unknown error types (within attempt limits)
  return true
}

/**
 * Calculates the retry delay using exponential backoff with jitter
 * @param {number} attemptNumber - The attempt number (1-based)
 * @returns {number} - Delay in milliseconds
 */
export function getRetryDelay(attemptNumber) {
  return computeNextDelay(attemptNumber)
}

/**
 * Determines if an error is retriable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retriable
 */
export function isRetriableError(error) {
  if (!error || !(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  // Network-related errors that are typically retriable
  const retriablePatterns = [
    'network error',
    'connection error',
    'websocket connection error',
    'failed to fetch',
    'timeout',
    'connection timeout',
    'connection refused',
    'connection reset',
    'connection aborted',
    'socket hang up',
    'econnreset',
    'econnrefused',
    'enotfound',
    'etimedout'
  ]

  // Check if the error message contains any retriable patterns
  return retriablePatterns.some(pattern => message.includes(pattern))
}

