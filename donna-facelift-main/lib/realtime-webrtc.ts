import { voiceTools } from '@/lib/voice-tools'

// Dynamic import to handle missing package gracefully - use type-only import for types
import type { RealtimeAgentConfiguration } from '@openai/agents-realtime'

let RealtimeAgent: any = null
let RealtimeSession: any = null

// Lazy load the actual implementation
async function loadRealtimeModule() {
  if (RealtimeAgent && RealtimeSession) return { RealtimeAgent, RealtimeSession }
  
  try {
    const realtimeModule = await import('@openai/agents-realtime')
    RealtimeAgent = realtimeModule.RealtimeAgent
    RealtimeSession = realtimeModule.RealtimeSession
    return { RealtimeAgent, RealtimeSession }
  } catch (e) {
    console.warn('@openai/agents-realtime not available:', e)
    throw new Error('Realtime module not available')
  }
}

export type StartRealtimeOptions = {
  tokenEndpoint?: string
  model?: string
  instructions?: string
  voice?: string
}

export async function startRealtimeSession(options: StartRealtimeOptions = {}) {
  const tokenEndpoint = options.tokenEndpoint || '/api/realtime/token'
  // 1) Get short-lived client token from our server
  const tokenRes = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      instructions: options.instructions,
      voice: options.voice,
    }),
  })

  if (!tokenRes.ok) {
    const msg = await tokenRes.text()
    throw new Error(`Failed to obtain realtime token: ${msg}`)
  }

  type RealtimeTokenResponse = { client_secret?: { value?: string } }
  const tokenData: RealtimeTokenResponse = await tokenRes.json()
  const apiKey: string | undefined = tokenData?.client_secret?.value
  if (!apiKey) {
    throw new Error('Server did not return client_secret.value')
  }

  // 2) Load the realtime module
  const { RealtimeAgent: Agent, RealtimeSession: Session } = await loadRealtimeModule()
  
  // 3) Create a RealtimeAgent with tools
  const agentOptions: RealtimeAgentConfiguration = {
    name: 'DONNA',
    instructions: options.instructions || 'You are DONNA, a helpful AI receptionist. Be professional, friendly, and concise. Use tools when the user asks to send emails or texts, log notes, or manage contacts. Confirm actions briefly.',
    tools: voiceTools,
    voice: options.voice,
  }
  const agent = new Agent(agentOptions)

  // 4) Create session and auto-approve tool calls
  const session = new Session(agent, {
    model: options.model || (process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview'),
    automaticallyTriggerResponseForMcpToolCalls: true,
  })

  // Auto-approve tool calls when requested
  session.on('tool_approval_requested', async (_ctx, _agent, approvalRequest) => {
    try { await session.approve(approvalRequest.approvalItem, { alwaysApprove: true }) } catch {}
  })

  // 5) Connect via WebRTC (browser) with mic/speaker automatically managed
  await session.connect({ apiKey })

  return { agent, session }
}
