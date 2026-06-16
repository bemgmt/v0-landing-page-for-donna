// Lightweight Supabase REST client without external deps
// Uses service role key for server-only routes

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.warn('[supabase-rest] SUPABASE_URL missing')
}

function srvHeaders(extra: Record<string, string> = {}) {
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function supaGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/rest/v1/${path}`, SUPABASE_URL)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: srvHeaders() })
  if (!res.ok) throw new Error(`Supabase GET ${path} failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

async function supaUpsert<T = unknown>(path: string, body: unknown): Promise<T> {
  const url = new URL(`/rest/v1/${path}`, SUPABASE_URL)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: srvHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase UPSERT ${path} failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

export async function upsertUserByClerkId(clerkId: string, email?: string) {
  type UserRow = { id: string; clerk_id: string; email?: string }
  const result = await supaUpsert<UserRow[]>('users', [{ clerk_id: clerkId, email }])
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('Failed to upsert user')
  }
  return result[0]
}

export async function getUserByClerkId(clerkId: string) {
  type UserRow = { id: string; clerk_id: string; email?: string }
  const rows = await supaGet<UserRow[]>('users', { select: 'id,clerk_id,email', clerk_id: `eq.${clerkId}`, limit: '1' })
  if (!Array.isArray(rows)) return null
  return rows[0] || null
}

export async function saveGmailTokens(userId: string, tokens: { refresh_token: string; scope?: string; token_type?: string; expiry_date?: number }) {
  const payload = [{
    user_id: userId,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
  }]
  type TokenRow = { user_id: string }
  const result = await supaUpsert<TokenRow[]>('gmail_tokens', payload)
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('Failed to save Gmail tokens')
  }
  return result[0]
}

export async function getGmailTokens(userId: string) {
  type TokenRow = { user_id: string; refresh_token: string; scope?: string; token_type?: string; expiry_date?: number }
  const rows = await supaGet<TokenRow[]>('gmail_tokens', { select: '*', user_id: `eq.${userId}`, limit: '1' })
  if (!Array.isArray(rows)) return null
  return rows[0] || null
}

export async function insertEmailLog(userId: string | null, input: { to_address: string; subject: string; status: string; error?: string }) {
  const payload = [{ user_id: userId, ...input }]
  const result = await supaUpsert<unknown[]>('email_logs', payload)
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('Failed to insert email log')
  }
  return result[0]
}

export async function createChatSession(userId: string | null, chatId: string) {
  const payload = [{ user_id: userId, chat_id: chatId }]
  type SessionRow = { id: string; chat_id: string }
  const result = await supaUpsert<SessionRow[]>('chat_sessions', payload)
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('Failed to create chat session')
  }
  return result[0]
}

export async function insertMessages(sessionId: string, messages: Array<{ role: string; content: string }>) {
  if (!messages?.length) return []
  const payload = messages.map(m => ({ session_id: sessionId, role: m.role, content: m.content }))
  return supaUpsert<unknown[]>('messages', payload)
}

