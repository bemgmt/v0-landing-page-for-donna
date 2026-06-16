// WS2 Contract Test (no network, no external APIs)
// Simulates the realtime message flow between a client and a server using EventEmitters.
// Run: node scripts/ws2-contract-test.mjs

import { EventEmitter } from 'events'

// Simple bus to pass frames between client and server
class Bus extends EventEmitter {}

// Fake Server that enforces WS2 contract
class FakeServer {
  constructor(bus, { enableVad = false } = {}) {
    this.bus = bus
    this.enableVad = enableVad
    this.pendingText = null
    bus.on('client->server', (frame) => this.onMessage(frame))
  }

  onMessage(frame) {
    switch (frame?.type) {
      case 'connect_realtime': {
        this.bus.emit('server->client', { type: 'session_created', session: { id: 'test-session' } })
        break
      }
      case 'conversation.item.create': {
        this.pendingText = frame?.item?.content?.[0]?.text || ''
        break
      }
      case 'response.create': {
        const text = this.pendingText || 'OK'
        // Mimic OpenAI delta stream and completion
        const pieces = text.split(/(\s+)/)
        for (const p of pieces) {
          if (!p) continue
          this.bus.emit('server->client', { type: 'response.output_text.delta', delta: p })
        }
        this.bus.emit('server->client', { type: 'response.done', response: { id: 'r_1', status: 'completed' } })
        this.pendingText = null
        break
      }
      case 'input_audio_buffer.append': {
        // Accept audio; no-op until commit
        break
      }
      case 'input_audio_buffer.commit': {
        if (this.enableVad) {
          this.bus.emit('server->client', { type: 'input_audio_buffer.speech_stopped' })
        }
        // Respond to committed audio
        this.pendingText = 'Audio received'
        this.onMessage({ type: 'response.create' })
        break
      }
      default: {
        this.bus.emit('server->client', { type: 'error', error: 'Unknown message type' })
      }
    }
  }
}

// Fake Client that speaks WS2 protocol
class FakeClient {
  constructor(bus) {
    this.bus = bus
    this.transcript = ''
    this.events = []
    bus.on('server->client', (frame) => this.onMessage(frame))
  }
  send(frame) { this.bus.emit('client->server', frame) }
  onMessage(frame) {
    this.events.push(frame.type)
    if (frame.type === 'response.output_text.delta') this.transcript += frame.delta
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

async function run() {
  console.log('WS2 Contract Test — starting')
  const bus = new Bus()
  const server = new FakeServer(bus, { enableVad: false })
  const client = new FakeClient(bus)

  // 1) Handshake
  client.send({ type: 'connect_realtime' })
  await new Promise((r) => setTimeout(r, 5))
  assert(client.events.includes('session_created'), 'session_created not received')
  console.log('✓ Handshake OK')

  // 2) Text flow
  client.send({
    type: 'conversation.item.create',
    item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Hello Donna' }] },
  })
  client.send({ type: 'response.create' })
  await new Promise((r) => setTimeout(r, 5))
  assert(client.transcript.trim().length > 0, 'no text deltas accumulated')
  assert(client.events.includes('response.done'), 'response.done not received')
  console.log('✓ Text roundtrip OK')

  // 3) Audio append/commit flow
  client.transcript = ''
  client.events.length = 0
  client.send({ type: 'input_audio_buffer.append', audio: 'AA==' })
  client.send({ type: 'input_audio_buffer.append', audio: 'BB==' })
  client.send({ type: 'input_audio_buffer.commit' })
  await new Promise((r) => setTimeout(r, 5))
  assert(client.events.includes('response.done'), 'audio response.done not received')
  console.log('✓ Audio append/commit OK')

  console.log('WS2 Contract Test — passed')
}

run().catch((e) => {
  console.error('WS2 Contract Test — failed:', e.message)
  process.exit(1)
})

