// WS2 Latency Budget Smoke (simulated, no network)
// Measures timing between response.create and first delta/audio frame under a stub server.
// Run: node scripts/ws2-latency-smoke.mjs

import { EventEmitter } from 'events'

class Bus extends EventEmitter {}

class TimedServer {
  constructor(bus, { textDelayMs = 30, audioDelayMs = 40 } = {}) {
    this.bus = bus
    this.textDelayMs = textDelayMs
    this.audioDelayMs = audioDelayMs
    bus.on('client->server', (f) => this.onMessage(f))
  }
  onMessage(f) {
    if (f?.type === 'connect_realtime') {
      this.bus.emit('server->client', { type: 'session_created', session: { id: 'latency' } })
    } else if (f?.type === 'response.create') {
      setTimeout(() => this.bus.emit('server->client', { type: 'response.output_text.delta', delta: 'Hi' }), this.textDelayMs)
      setTimeout(() => this.bus.emit('server->client', { type: 'response.audio.delta', delta: 'AA==' }), this.audioDelayMs)
    }
  }
}

async function run() {
  const bus = new Bus()
  const server = new TimedServer(bus, { textDelayMs: 25, audioDelayMs: 35 })
  const t0 = Date.now()
  let tText = null, tAudio = null
  bus.on('server->client', (f) => {
    if (f.type === 'response.output_text.delta' && tText == null) tText = Date.now()
    if (f.type === 'response.audio.delta' && tAudio == null) tAudio = Date.now()
  })
  bus.emit('client->server', { type: 'connect_realtime' })
  // trigger response
  bus.emit('client->server', { type: 'response.create' })
  await new Promise((r) => setTimeout(r, 80))
  if (tText == null || tAudio == null) throw new Error('no deltas observed')
  const textLatency = tText - t0
  const audioLatency = tAudio - t0
  if (textLatency > 60) throw new Error(`text latency too high: ${textLatency}ms`)
  if (audioLatency > 70) throw new Error(`audio latency too high: ${audioLatency}ms`)
  console.log(`Latency OK — text ${textLatency}ms, audio ${audioLatency}ms`)
}

run().catch((e) => { console.error('Latency smoke failed:', e.message); process.exit(1) })

