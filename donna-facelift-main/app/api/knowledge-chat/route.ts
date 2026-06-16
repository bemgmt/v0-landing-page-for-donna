import { NextRequest } from 'next/server'
import { jsonNoStore } from '@/lib/http'
import { authenticateRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { loadDonnaKnowledgeBase } from '@/lib/donna-knowledge-base'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

const SECURITY_ENABLED =
  process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true'

const KNOWLEDGE_CHAT_RATE = {
  windowMs: 60_000,
  maxRequests: 30,
} as const

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(16_384),
})

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
})

function buildSystemPrompt(knowledge: string): string {
  return `You are DONNA, an AI assistant for the DONNA product and investor conversations.

Rules:
- Ground answers in the internal knowledge documents below when they are relevant. If something is not in the documents, say you do not have that information rather than inventing it.
- Do not give legal, tax, or investment advice; you may summarize what the documents say about financing at a high level only.
- Be concise, professional, and friendly.

--- INTERNAL KNOWLEDGE (not shown to the user) ---

${knowledge}`
}

async function isInternalApiAuthorized(req: NextRequest): Promise<boolean> {
  const apiSecret = process.env.API_SECRET || ''
  if (!apiSecret) return false
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.toLowerCase().startsWith('Bearer ')) return false
  const token = authHeader.slice(7).trim()
  if (token.length !== apiSecret.length) return false
  try {
    const { timingSafeEqual } = await import('crypto')
    return timingSafeEqual(Buffer.from(token), Buffer.from(apiSecret))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const internal = await isInternalApiAuthorized(req)
    let rateLimitKey: string

    if (internal) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-real-ip') ||
        req.ip ||
        'unknown'
      rateLimitKey = `knowledge-chat:internal:${ip}`
    } else {
      const authResult = await authenticateRequest(req)
      if (!authResult.success) {
        return jsonNoStore(
          req,
          { success: false, error: 'Authentication required' },
          { status: 401, securityEnabled: SECURITY_ENABLED }
        )
      }
      rateLimitKey = `knowledge-chat:${authResult.identifier}`
    }

    const rateLimitResult = checkRateLimit(rateLimitKey, KNOWLEDGE_CHAT_RATE)
    if (!rateLimitResult.success) {
      return jsonNoStore(
        req,
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.max(0, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
        { status: 429, securityEnabled: SECURITY_ENABLED }
      )
    }

    let json: unknown
    try {
      json = await req.json()
    } catch {
      return jsonNoStore(
        req,
        { success: false, error: 'Invalid JSON body' },
        { status: 400, securityEnabled: SECURITY_ENABLED }
      )
    }

    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonNoStore(
        req,
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400, securityEnabled: SECURITY_ENABLED }
      )
    }

    const { messages } = parsed.data

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return jsonNoStore(
        req,
        { success: false, error: 'Server missing OPENAI_API_KEY' },
        { status: 500, securityEnabled: SECURITY_ENABLED }
      )
    }

    const model = process.env.OPENAI_KNOWLEDGE_CHAT_MODEL || 'gpt-4o-mini'
    const knowledge = loadDonnaKnowledgeBase()
    if (!knowledge) {
      return jsonNoStore(
        req,
        { success: false, error: 'Knowledge base is empty or missing files' },
        { status: 500, securityEnabled: SECURITY_ENABLED }
      )
    }

    const systemContent = buildSystemPrompt(knowledge)
    const openaiMessages = [
      { role: 'system' as const, content: systemContent },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const ac = new AbortController()
    const timeoutMs = Number(process.env.OPENAI_HTTP_TIMEOUT_MS ?? process.env.FETCH_TIMEOUT_MS) || 120_000
    const to = setTimeout(() => ac.abort(), timeoutMs)

    let resp: Response
    try {
      resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: openaiMessages,
          temperature: 0.65,
          max_tokens: 2048,
        }),
        signal: ac.signal,
      })
    } finally {
      clearTimeout(to)
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      console.error('[knowledge-chat] OpenAI error', resp.status, errText.slice(0, 500))
      Sentry.captureMessage(`knowledge-chat OpenAI ${resp.status}`, { level: 'error' })
      return jsonNoStore(
        req,
        { success: false, error: 'Upstream model error' },
        { status: 502, securityEnabled: SECURITY_ENABLED }
      )
    }

    const data = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
    }
    const reply = (data.choices?.[0]?.message?.content ?? '').trim()
    if (!reply) {
      return jsonNoStore(
        req,
        { success: false, error: 'Empty model response' },
        { status: 502, securityEnabled: SECURITY_ENABLED }
      )
    }

    return jsonNoStore(req, { success: true, reply }, { securityEnabled: SECURITY_ENABLED })
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return jsonNoStore(
      req,
      { success: false, error: message },
      { status: 500, securityEnabled: SECURITY_ENABLED }
    )
  }
}
