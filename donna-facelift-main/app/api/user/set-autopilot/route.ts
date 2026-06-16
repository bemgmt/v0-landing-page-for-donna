
import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSupabaseAdminOrThrow } from '@/lib/supabase-admin'
import { z } from 'zod'
import { parseJson, isBadRequestError } from '@/lib/http-parse'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const schema = z.object({ enabled: z.boolean() })
    const { enabled } = await parseJson(req, schema)

    const supabaseAdmin = getSupabaseAdminOrThrow()
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single()

    if (userError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ autopilot_enabled: enabled })
      .eq('id', userData.id)

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true, autopilot_enabled: enabled }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (err: unknown) {
    if (isBadRequestError(err)) {
      return NextResponse.json({ error: err.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    console.error("Error in set-autopilot route:", err);
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to update autopilot status' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
