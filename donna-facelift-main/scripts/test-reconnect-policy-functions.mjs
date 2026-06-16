import { computeNextDelay, shouldRetry, getRetryDelay, isRetriableError } from '../lib/reconnect-policy.js'

function assert(cond, msg) { 
  if (!cond) throw new Error(msg) 
}

console.log('Testing reconnect policy functions...')

// Test computeNextDelay (existing function)
console.log('✓ Testing computeNextDelay...')
const base = 500, cap = 5000, jitter = 250
for (let attempt = 1; attempt <= 6; attempt++) {
  const d = computeNextDelay(attempt, base, cap, jitter)
  const expo = Math.min(cap, base * Math.pow(2, attempt - 1))
  assert(d >= expo && d < expo + jitter, `attempt ${attempt} out of range: ${d}`)
}

// Test getRetryDelay
console.log('✓ Testing getRetryDelay...')
for (let attempt = 1; attempt <= 5; attempt++) {
  const delay = getRetryDelay(attempt)
  assert(delay >= 500, `delay too small for attempt ${attempt}: ${delay}`)
  assert(delay <= 5250, `delay too large for attempt ${attempt}: ${delay}`)
}

// Test isRetriableError
console.log('✓ Testing isRetriableError...')

// Retriable errors
const retriableErrors = [
  new Error('Network error occurred'),
  new Error('Connection error'),
  new Error('WebSocket connection error'),
  new Error('Failed to fetch'),
  new Error('Connection timeout'),
  new Error('ECONNRESET'),
  new Error('ECONNREFUSED'),
  new Error('ETIMEDOUT')
]

retriableErrors.forEach((error, i) => {
  assert(isRetriableError(error), `Error ${i} should be retriable: ${error.message}`)
})

// Non-retriable errors
const nonRetriableErrors = [
  new Error('Authentication failed'),
  new Error('Invalid request'),
  new Error('Permission denied'),
  null,
  undefined,
  'string error'
]

nonRetriableErrors.forEach((error, i) => {
  assert(!isRetriableError(error), `Error ${i} should not be retriable: ${error}`)
})

// Test shouldRetry
console.log('✓ Testing shouldRetry...')

// Test max attempts limit
assert(!shouldRetry(new Error('test'), 5, 5), 'Should not retry when at max attempts')
assert(!shouldRetry(new Error('test'), 6, 5), 'Should not retry when over max attempts')
assert(shouldRetry(new Error('Network error'), 3, 5), 'Should retry when under max attempts with retriable error')

// Test WebSocket close codes
const normalClose = { code: 1000 }
const abnormalClose = { code: 1006 }
const goingAway = { code: 1001 }
const protocolError = { code: 1002 }

assert(!shouldRetry(normalClose, 1, 5), 'Should not retry normal close')
assert(!shouldRetry(goingAway, 1, 5), 'Should not retry going away')
assert(!shouldRetry(protocolError, 1, 5), 'Should not retry protocol error')
assert(shouldRetry(abnormalClose, 1, 5), 'Should retry abnormal close')

// Test with retriable/non-retriable errors
assert(shouldRetry(new Error('Network error'), 1, 5), 'Should retry retriable error')
assert(!shouldRetry(new Error('Authentication failed'), 1, 5), 'Should not retry non-retriable error')

console.log('✅ All reconnect policy function tests passed!')
