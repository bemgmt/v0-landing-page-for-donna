#!/usr/bin/env node

// Fanout smoke: POST /api/voice/fanout and expect { success: true }
// Usage: FANOUT_BASE=http://localhost:3000 node scripts/fanout-smoke.mjs

const base = process.env.FANOUT_BASE || 'http://localhost:3000'

async function main() {
  const url = `${base}/api/voice/fanout`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'smoke', text: 'hello', at: Date.now() })
  })
  if (!res.ok) {
    throw new Error(`Fanout responded with status ${res.status}`)
  }
  const json = await res.json().catch(() => ({}))
  if (json && json.success === true) {
    console.log('✅ Fanout smoke passed')
  } else if (json && (json.ok === true && json.note)) {
    // Allow OK w/ note when PHP base not configured
    console.log('✅ Fanout smoke (no PHP base) passed:', json.note)
  } else {
    throw new Error(`Unexpected fanout response: ${JSON.stringify(json)}`)
  }
}

main().catch(err => { console.error('❌ Fanout smoke failed:', err.message); process.exit(1) })
