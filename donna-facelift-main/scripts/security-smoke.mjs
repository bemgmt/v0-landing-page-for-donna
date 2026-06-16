#!/usr/bin/env node

// Lightweight security smoke checks for the hardened token endpoint and CORS.
// Usage:
//   SMOKE_BASE=http://localhost:3000 SMOKE_ORIGIN=http://localhost:3000 SMOKE_JWT=dev.header.payload node scripts/security-smoke.mjs

const base = process.env.SMOKE_BASE || 'http://localhost:3000'
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000'
const jwt = process.env.SMOKE_JWT || process.env.NEXT_PUBLIC_DEV_JWT || ''

function log(title, ok, extra = '') {
  const icon = ok ? '✅' : '❌'
  console.log(`${icon} ${title}${extra ? `: ${extra}` : ''}`)
}

async function main() {
  let allGood = true

  // 1) Preflight CORS (OPTIONS)
  try {
    const res = await fetch(`${base}/api/realtime/token`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    })
    const ok = res.status === 204 || res.status === 200
    log('CORS preflight', ok, `status=${res.status}`)
    if (!ok) allGood = false
  } catch (e) {
    log('CORS preflight', false, e.message)
    allGood = false
  }

  // 2) Token without auth should be 401/403
  try {
    const res = await fetch(`${base}/api/realtime/token`, {
      method: 'POST',
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voice: 'alloy' })
    })
    const ok = res.status === 401 || res.status === 403
    log('Token without auth blocked', ok, `status=${res.status}`)
    if (!ok) allGood = false
  } catch (e) {
    log('Token without auth', false, e.message)
    allGood = false
  }

  // 3) Token with dev JWT auth should NOT be 401/403
  if (jwt) {
    try {
      const res = await fetch(`${base}/api/realtime/token`, {
        method: 'POST',
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ voice: 'alloy' })
      })
      const ok = ![401,403].includes(res.status)
      log('Token with dev JWT (auth path)', ok, `status=${res.status}`)
      if (!ok) allGood = false
    } catch (e) {
      log('Token with dev JWT', false, e.message)
      allGood = false
    }
  } else {
    console.log('ℹ Skipping dev JWT auth test (set SMOKE_JWT to run)')
  }

  // 4) Bad origin should be blocked (403)
  try {
    const res = await fetch(`${base}/api/realtime/token`, {
      method: 'POST',
      headers: {
        'Origin': 'http://malicious.tld',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voice: 'alloy' })
    })
    const ok = res.status === 403
    log('Token with bad origin blocked', ok, `status=${res.status}`)
    if (!ok) allGood = false
  } catch (e) {
    log('Bad origin test', false, e.message)
    allGood = false
  }

  if (!allGood) {
    process.exit(1)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
