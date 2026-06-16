import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { parseJson, isBadRequestError } from '@/lib/http-parse'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // We use the API secret for this internal logging route
    const rawAuth = req.headers.get('authorization') || ''
    const match = rawAuth.match(/^Bearer\s+(.+)$/i)
    const token = match?.[1] || ''
    const apiSecret = process.env.API_SECRET
    if (!apiSecret) {
      console.error('[ABUSE_LOG] Missing API_SECRET')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }
    const provided = Buffer.from(token)
    const expected = Buffer.from(apiSecret)
    const valid = provided.length === expected.length && timingSafeEqual(provided, expected)
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })

    const schema = z.object({
      chat_id: z.string().min(1).max(128),
      user_id: z.string().min(1).max(128).optional(),
      message: z.string().min(1).max(2000),
    })
    const { chat_id, user_id, message } = await parseJson(req, schema)

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }
    const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/abuse_log`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ chat_id, user_id, message }]),
      signal: controller.signal,
      cache: 'no-store'
    }).finally(() => clearTimeout(timeout))
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error('[ABUSE_LOG insert failed]', { status: res.status, details: errorText.slice(0, 500) })
      return NextResponse.json({ error: 'Failed to insert log' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (isBadRequestError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    console.error('[API DB LOG ABUSE ERROR]', error)
    Sentry.withScope(scope => {
      scope.setTag('route', 'api/db/log/abuse')
      Sentry.captureException(error)
    })
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
