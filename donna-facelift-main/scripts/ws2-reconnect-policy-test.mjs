import { computeNextDelay } from '../lib/reconnect-policy.js'

function assert(cond, msg) { if (!cond) throw new Error(msg) }

const base = 500, cap = 5000, jitter = 250
for (let attempt = 1; attempt <= 6; attempt++) {
  const d = computeNextDelay(attempt, base, cap, jitter)
  const expo = Math.min(cap, base * Math.pow(2, attempt - 1))
  assert(d >= expo && d < expo + jitter, `attempt ${attempt} out of range: ${d}`)
}

console.log('Reconnect policy test passed')
