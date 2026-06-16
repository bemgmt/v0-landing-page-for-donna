import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSupabaseAdminOrThrow } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const supabaseAdmin = getSupabaseAdminOrThrow()
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, vertical, autopilot_enabled, created_at, updated_at')
        .eq('clerk_id', clerkId)
        .single()

    if (userError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: userData.id,
          email: userData.email,
          vertical: userData.vertical || null,
          autopilot_enabled: userData.autopilot_enabled || false,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        }
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );

  } catch (err: unknown) {
    console.error("Error in profile route:", err);
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to retrieve user profile' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

