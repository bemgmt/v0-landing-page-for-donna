// WS2 WebSocket Auth Smoke Test
// Verifies /realtime authentication behavior for three paths:
// 1) No auth -> close(4001) after AUTH_TIMEOUT_MS
// 2) Bad token -> auth_error then close(4003)
// 3) Good token -> auth_success
// Run: node scripts/ws2-ws-auth-smoke.mjs

import WebSocket from 'ws'
import crypto from 'crypto'

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001/realtime'
const JWT_SECRET = process.env.JWT_SECRET || ''
const AUTH_TIMEOUT_MS = parseInt(process.env.AUTH_TIMEOUT_MS || '3000') // keep short for smoke

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function signJwtHS256(payloadObj, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { ...payloadObj, iat: Math.floor(Date.now() / 1000) }
  const encHeader = base64url(JSON.stringify(header))
  const encPayload = base64url(JSON.stringify(payload))
  const data = `${encHeader}.${encPayload}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${sig}`
}

async function testNoAuthTimeout() {
  const ws = new WebSocket(WS_URL)
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for close')), AUTH_TIMEOUT_MS + 2000)
    ws.on('open', () => { /* do nothing: expect server to close with 4001 */ })
    ws.on('close', (c) => { clearTimeout(timer); resolve(c) })
    ws.on('error', (e) => { clearTimeout(timer); reject(e) })
  })
  if (code !== 4001) throw new Error(`expected close code 4001, got ${code}`)
}

async function testBadToken() {
  const ws = new WebSocket(WS_URL)
  const events = []
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for events')), 5000)
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'authenticate', token: 'not-a-valid-jwt' }))
    })
    ws.on('message', (m) => { events.push(JSON.parse(m.toString())) })
    ws.on('close', (code) => { clearTimeout(timer); resolve(code) })
    ws.on('error', (e) => { clearTimeout(timer); reject(e) })
  })
  const hasAuthError = events.some(e => e?.type === 'auth_error')
  if (!hasAuthError) throw new Error('expected auth_error frame')
  if (result !== 4003) throw new Error(`expected close code 4003, got ${result}`)
}

async function testGoodToken() {
  if (!JWT_SECRET) {
    console.log('JWT_SECRET not set; skipping good-token path (dev mode)')
    return
  }
  const ws = new WebSocket(WS_URL)
  const events = []
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for auth_success')), 5000)
    ws.on('open', () => {
      const token = signJwtHS256({ sub: 'ws2-smoke' }, JWT_SECRET)
      ws.send(JSON.stringify({ type: 'authenticate', token }))
    })
    ws.on('message', (m) => {
      try { events.push(JSON.parse(m.toString())) } catch {}
      if (events.some(e => e?.type === 'auth_success')) { clearTimeout(timer); resolve(null) }
    })
    ws.on('error', (e) => { clearTimeout(timer); reject(e) })
  })
}

async function main() {
  console.log('WS2 WebSocket Auth Smoke — starting')
  await testNoAuthTimeout()
  console.log('✓ no-auth timeout 4001')
  await testBadToken()
  console.log('✓ bad token → 4003')
  await testGoodToken()
  console.log('✓ good token → auth_success (or skipped if JWT_SECRET absent)')
  console.log('WS2 WebSocket Auth Smoke — passed')
}

main().catch((e) => { console.error('WS2 WebSocket Auth Smoke — failed:', e.message); process.exit(1) })

