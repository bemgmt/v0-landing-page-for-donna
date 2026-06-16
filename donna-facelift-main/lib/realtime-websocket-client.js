import EventEmitter from 'events'
import WebSocket from 'ws'

/**
 * Minimal OpenAI Realtime WebSocket client used by test-realtime-websocket.mjs
 */
export default class DonnaRealtimeClient extends EventEmitter {
  /**
   * @param {string} apiKey
   * @param {{ model?: string, instructions?: string, voice?: string }} [options]
   */
  constructor(apiKey, options = {}) {
    super()
    this.apiKey = apiKey
    this.model = options.model || 'gpt-4o-realtime-preview-2024-12-17'
    this.instructions = options.instructions || 'You are DONNA, a professional AI receptionist. Be warm, friendly, and concise.'
    this.voice = options.voice || 'alloy'
    this.ws = null
    this.wsUrl = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(this.model)}`
  }

  async connect() {
    if (!this.apiKey) throw new Error('Missing OPENAI_API_KEY')
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(this.wsUrl, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    })

    this.ws.on('open', () => {
      // Configure session when connected
      this.ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.instructions,
          voice: this.voice,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          temperature: 0.7,
        }
      }))
    })

    this.ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString())
        const t = data?.type
        switch (t) {
          case 'session.created':
            this.emit('session_created', data.session)
            break
          case 'input_audio_buffer.speech_started':
            this.emit('speech_started')
            break
          case 'input_audio_buffer.speech_stopped':
            this.emit('speech_stopped')
            break
          case 'response.audio_transcript.delta':
            if (data.delta) this.emit('transcript_delta', data.delta)
            break
          case 'response.audio.delta':
            if (data.delta) {
              const buf = Buffer.from(data.delta, 'base64')
              this.emit('audio_delta', buf)
            }
            break
          case 'response.done':
            this.emit('response_done', data.response)
            break
          case 'error':
            this.emit('error', data.error?.message || 'Unknown error')
            break
          default:
            // No-op for other events
            break
        }
      } catch (e) {
        this.emit('error', e?.message || 'Malformed message')
      }
    })

    this.ws.on('close', () => {
      this.emit('disconnect')
    })

    this.ws.on('error', (err) => {
      this.emit('error', err?.message || String(err))
    })
  }

  /**
   * Send a text input. Sequence:
   * - conversation.item.create (user message)
   * - response.create (tell the model to respond)
   * @param {string} text
   */
  sendText(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    // Add user message
    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [ { type: 'input_text', text } ]
      }
    }))
    // Ask for a response
    this.ws.send(JSON.stringify({ type: 'response.create' }))
  }

  /**
   * Optional: send audio PCM16 chunks (base64) — not used by the current test
   * @param {Buffer|ArrayBuffer|Uint8Array} audio
   * @param {boolean} commit
   */
  sendAudio(audio, commit = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const buf = Buffer.isBuffer(audio) ? audio : Buffer.from(audio)
    const b64 = buf.toString('base64')
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }))
    if (commit) {
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
      this.ws.send(JSON.stringify({ type: 'response.create' }))
    }
  }

  disconnect() {
    try { this.ws?.close() } catch {}
  }
}

