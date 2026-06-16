import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
const SECURITY_ENABLED = process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true'
import * as Sentry from '@sentry/nextjs'
export const dynamic = 'force-dynamic'
import { getSupabaseAdminOrThrow } from '@/lib/supabase-admin'
import { z } from 'zod'
import { parseJson, isBadRequestError } from '@/lib/http-parse'

type MsgIn = { role?: 'system'|'user'|'assistant'; type?: 'user'|'assistant'|'system'; content?: string; text?: string } | string

function normalizeMessages(msgs: unknown): Array<{ role: 'system'|'user'|'assistant'; content: string }> {
  const toRole = (m: MsgIn | string | unknown): 'system'|'user'|'assistant' => {
    if (typeof m !== 'object' || m === null) return 'user'
    const obj = m as { role?: unknown; type?: unknown }
    const r = (typeof obj.role === 'string' ? obj.role : (typeof obj.type === 'string' ? obj.type : undefined))
    if (r === 'assistant' || r === 'system') return r
    return 'user'
  }
  const toContent = (m: MsgIn | string | unknown): string => {
    if (typeof m === 'string') return m
    if (typeof m === 'object' && m !== null) {
      const obj = m as { content?: unknown; text?: unknown }
      if (typeof obj.content === 'string') return obj.content.trim()
      if (typeof obj.text === 'string') return obj.text.trim()
    }
    return ''
  }
  const arr: MsgIn[] = Array.isArray(msgs) ? (msgs as MsgIn[]) : []
  return arr
    .map(m => ({ role: toRole(m), content: toContent(m) }))
    .filter(m => m.content.length > 0) as Array<{ role: 'system'|'user'|'assistant'; content: string }>
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const apiSecret = process.env.API_SECRET || ''
    let isInternal = false
    if (apiSecret && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim()
      if (token.length === apiSecret.length) {
        const { timingSafeEqual } = await import('crypto')
        const a = Buffer.from(token)
        const b = Buffer.from(apiSecret)
        isInternal = timingSafeEqual(a, b)
      }
    }

    const { userId: clerkId } = await auth()
    if (!isInternal && !clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store', 'WWW-Authenticate': 'Bearer' } }
      )
    }

    // Parse and normalize request body
    const schema = z.object({
      chatId: z.string().optional(),
      chat_id: z.string().optional(),
      chatID: z.string().optional(),
      messages: z.array(z.union([
        z.string(),
        z.object({ role: z.enum(['system','user','assistant']).optional(), type: z.enum(['user','assistant','system']).optional(), content: z.string().optional(), text: z.string().optional() })
      ])).optional(),
      message: z.union([z.string(), z.object({ role: z.enum(['system','user','assistant']).optional(), type: z.enum(['user','assistant','system']).optional(), content: z.string().optional(), text: z.string().optional() })]).optional(),
      clerkId: z.string().optional()
    })
    const r = await parseJson(req, schema)

    const chatId: string | undefined = r.chatId || r.chat_id || r.chatID
    const legacySingleMessage = r.message ? [r.message] : undefined
    const sourceMessages = Array.isArray(r.messages) ? r.messages : (legacySingleMessage || [])
    const bodyClerkId: string | undefined = r.clerkId

    if (!chatId || sourceMessages.length === 0) {
      return NextResponse.json({ error: 'chatId/chat_id and messages/message are required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const MAX_MSGS = 50
    const MAX_MSG_CHARS = 8_192
    const messages = normalizeMessages(sourceMessages)
      .map(m => ({ ...m, content: m.content.slice(0, MAX_MSG_CHARS) }))
      .slice(0, MAX_MSGS)
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No valid messages to persist' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const supabaseAdmin = getSupabaseAdminOrThrow()

    // Resolve user context
    let userRowId: string | null = null
    const effectiveClerkId = clerkId || bodyClerkId || null
    if (effectiveClerkId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({ clerk_id: effectiveClerkId }, { onConflict: 'clerk_id' })
        .select('id')
        .single()
      if (userError || !userData) {
        return NextResponse.json({ error: 'Failed to upsert user', ...(SECURITY_ENABLED ? {} : { details: userError?.message }) }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
      }
      userRowId = userData.id
    }

    // Atomic claim/create session to avoid TOCTOU hijack
    const { data: sessionData, error: claimError } = await supabaseAdmin
      .rpc('claim_chat_session', { p_chat_id: chatId, p_user_id: userRowId })
      .single()
    if (claimError || !sessionData) {
      // P0001 from function signals conflict (belongs to another user)
      const status = (claimError as any)?.code === 'P0001' ? 409 : 500
      const msg = status === 409 ? 'Chat session belongs to a different user' : 'Failed to upsert session'
      return NextResponse.json({ error: msg, ...(SECURITY_ENABLED ? {} : { details: claimError?.message }) }, { status, headers: { 'Cache-Control': 'no-store' } })
    }

    // Insert messages
    const rows = messages.map(m => ({ session_id: (sessionData as any).id, role: m.role, content: m.content }))
    const { error: msgError } = await supabaseAdmin.from('messages').insert(rows)
    if (msgError) return NextResponse.json({ error: 'Failed to insert messages', ...(SECURITY_ENABLED ? {} : { details: msgError.message }) }, { status: 500, headers: { 'Cache-Control': 'no-store' } })

    // Emit soft warnings to encourage migration to canonical shape
    if (r.chat_id && !r.chatId) {
      console.warn('[DB CHAT] Received legacy chat_id; prefer chatId')
    }
    if (r.message && !r.messages) {
      console.warn('[DB CHAT] Received legacy message; prefer messages[]')
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: unknown) {
    if (isBadRequestError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    console.error('[API DB CHAT ERROR]', error)
    Sentry.captureException(error)
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
