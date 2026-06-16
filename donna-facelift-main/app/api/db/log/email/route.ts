import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'crypto'

export async function POST(req: Request) {
  try {
    // We use the API secret for this internal logging route
    const authHeader = req.headers.get('authorization') || ''
    const apiSecret = process.env.API_SECRET || ''
    const provided = Buffer.from(authHeader.replace(/^Bearer\s+/i, ''))
    const expected = Buffer.from(apiSecret)
    const valid = apiSecret.length > 0 && provided.length === expected.length && timingSafeEqual(provided, expected)
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })

    const body = await req.json()
    const { user_id, to_address, subject, status, error: errorMessage } = body

    if (!to_address || !subject || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }
    const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
      method: 'POST', headers, body: JSON.stringify([{ user_id, to_address, subject, status, error: errorMessage }]),
      signal: controller.signal,
      cache: 'no-store'
    }).finally(() => clearTimeout(timeout))
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to insert log' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[API DB LOG EMAIL ERROR]', error)
    Sentry.captureException(error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
