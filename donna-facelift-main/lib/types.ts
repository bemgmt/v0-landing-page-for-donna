// Shared minimal DTOs for API payloads

export type ChatMessageDTO = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatPersistRequest = {
  chatId: string
  messages: ChatMessageDTO[]
  clerkId?: string
}

export type EmailRequest = {
  to: string
  subject: string
  body: string
}

export type GmailDraftRequest = {
  message: unknown
  goal: string
}

// --- Added shared DTOs to support typed routes ---

// Token issuance request for realtime endpoint
export type TokenRequest = {
  instructions?: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  model?: string
}

// Event payloads sent from voice UI; intentionally loose
export type VoiceEvent = Record<string, unknown>

// Input shape accepted by db/chat route before normalization
export type ChatMessageInput = { role?: 'system'|'user'|'assistant'; type?: 'user'|'assistant'|'system'; content?: string; text?: string } | string

// Gmail typed shapes used in gmail/* routes
export type GmailHeader = { name: string; value: string }
export type GmailMessagePart = {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailMessagePart[]
}
export type GmailMessagePayload = {
  headers: GmailHeader[]
  body?: { data?: string }
  parts?: GmailMessagePart[]
}
export type GmailMessage = {
  id?: string
  threadId?: string
  payload: GmailMessagePayload
  snippet?: string
}

// Draft reply request used by gmail/draft-reply
export type DraftReplyRequest = {
  message: GmailMessage
  goal: string
}

