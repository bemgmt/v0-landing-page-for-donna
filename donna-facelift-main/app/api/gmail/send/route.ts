import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
export const dynamic = 'force-dynamic'
import { getSupabaseAdminOrThrow } from '@/lib/supabase-admin'
import { z } from 'zod'
import { parseJson, isBadRequestError } from '@/lib/http-parse'
import { google } from 'googleapis'

async function getUserAndTokens(clerkId: string) {
  const supabaseAdmin = getSupabaseAdminOrThrow()
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  if (userError || !userData) throw new Error('User not found')
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('gmail_tokens')
    .select('refresh_token')
    .eq('user_id', userData.id)
    .single()
  if (tokenError || !tokenData) throw new Error('Gmail not connected')
  return { userId: userData.id, refreshToken: tokenData.refresh_token }
}

async function insertEmailLogRow(userId: string | null, to: string, subject: string, status: string, error?: string) {
  const supabaseAdmin = getSupabaseAdminOrThrow()
  await supabaseAdmin.from('email_logs').insert({ user_id: userId, to_address: to, subject, status, error })
}

import type { OAuth2Client } from 'google-auth-library'
async function sendWithGoogleAPI(oauth2Client: OAuth2Client, to: string, subject: string, text: string, fromEmail: string) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const raw = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text,
  ].join('\r\n')
  const base64EncodedEmail = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw: base64EncodedEmail } })
}

async function getAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), 10000)
  const resp = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(), signal: ac.signal })
  clearTimeout(to)
  if (!resp.ok) throw new Error(`Failed to refresh token: ${resp.status} ${await resp.text()}`)
  const data = await resp.json() as { access_token: string }
  return data.access_token
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })

    const schema = z.object({ to: z.string().min(1), subject: z.string().optional(), body: z.string().optional() })
    const body = await parseJson(req, schema)
    const to = body.to?.trim()
    const subject = body.subject?.trim() || ''
    const text = body.body?.trim() || ''
    const sanitizeHeader = (v: string) => v.replace(/[\r\n:]/g, ' ').slice(0, 998)
    if (!to) return NextResponse.json({ error: 'Missing to' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })

    const { userId: dbUserId, refreshToken } = await getUserAndTokens(userId)
    const accessToken = await getAccessToken(refreshToken)

    const fromEmail = process.env.EMAIL_FROM || 'me'
    const safeTo = sanitizeHeader(to!)
    const safeSubject = sanitizeHeader(subject)
    const safeFrom = sanitizeHeader(fromEmail)
    // raw construction removed (using googleapis client below)

    // Use googleapis client to send
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oauth2Client.setCredentials({ access_token: accessToken })
    try {
      await sendWithGoogleAPI(oauth2Client, safeTo, safeSubject, text, safeFrom)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'send failed'
      Sentry.captureException(e instanceof Error ? e : new Error(message))
      await insertEmailLogRow(dbUserId, safeTo, safeSubject, 'error', message)
      return NextResponse.json({ error: 'Failed to send' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }

    await insertEmailLogRow(dbUserId, safeTo, safeSubject, 'sent')
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: unknown) {
    if (isBadRequestError(err)) {
      return NextResponse.json({ error: err.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
