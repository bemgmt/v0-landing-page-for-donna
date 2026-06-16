// Centralized model configuration and simple router for Donna

export const MODEL_REALTIME = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview'
export const MODEL_AGENT_PRIMARY = process.env.OPENAI_AGENT_MODEL || 'gpt-4o'
export const MODEL_AGENT_FALLBACK = process.env.OPENAI_AGENT_MODEL_FALLBACK || 'gpt-4o-mini'
export const MODEL_MODERATION = process.env.OPENAI_MODERATION_MODEL || 'omni-moderation-latest'
export const MODEL_EMBEDDINGS = process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small'
export const MODEL_TTS = process.env.OPENAI_TTS_MODEL || 'tts-1'

export type ChooseAgentOptions = {
  critical?: boolean
  expectedTokens?: number // rough estimate of output length
  inputChars?: number // rough estimate of input length
  latencySensitive?: boolean // prefer mini if true
}

// Heuristic router: prefer mini, escalate to primary for critical/longform
export function chooseAgentModel(opts: ChooseAgentOptions = {}): string {
  const {
    critical = false,
    expectedTokens = 350,
    inputChars = 2000,
    latencySensitive = false,
  } = opts

  // Escalate to primary if:
  // - critical task (customer-facing email/sms), or
  // - long inputs (> 6k chars) or long outputs (> 800 tokens)
  // Otherwise, use mini for cost-efficiency and speed
  const longInput = inputChars > 6000
  const longOutput = expectedTokens > 800

  if (critical || longInput || longOutput) return MODEL_AGENT_PRIMARY

  // If latency sensitive, prefer mini unless critical
  if (latencySensitive) return MODEL_AGENT_FALLBACK

  // Default to mini to control costs
  return MODEL_AGENT_FALLBACK
}

