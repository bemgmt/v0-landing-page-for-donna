import WebSocket from 'ws'

const WS_URL = process.env.WS_URL || 'wss://donna-interactive-production.up.railway.app/realtime'

console.log('🧠 DONNA Remote WebSocket Smoke Test')
console.log('====================================')
console.log('🔗 Connecting to', WS_URL)

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
  console.log('✅ Connected to remote WebSocket server')
  // Ask backend to connect to OpenAI Realtime API
  ws.send(JSON.stringify({ type: 'connect_realtime' }))
})

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString())
    // console.log('📨', msg)
    switch (msg.type) {
      case 'welcome':
        console.log('👋', msg.message)
        break
      case 'session_created':
        console.log('✅ Realtime session created')
        // Send a short test message
        setTimeout(() => {
          console.log('📤 Sending test message...')
          ws.send(JSON.stringify({
            type: 'send_text',
            text: 'Hello DONNA, please confirm the production WebSocket is working.'
          }))
        }, 500)
        break
      case 'transcript_delta':
        process.stdout.write(msg.delta)
        break
      case 'audio_delta':
        // Received audio chunk (base64 PCM16)
        break
      case 'response_done':
        console.log('\n✅ Response done')
        ws.close()
        break
      case 'error':
      case 'realtime_error':
      case 'connection_error':
        console.error('❌ Error:', msg.error)
        ws.close()
        process.exit(1)
        break
      default:
        // console.log('ℹ️', msg.type)
        break
    }
  } catch (e) {
    console.error('❌ Failed to parse message:', e)
  }
})

ws.on('close', () => {
  console.log('\n🔌 WebSocket closed')
})

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message)
})

