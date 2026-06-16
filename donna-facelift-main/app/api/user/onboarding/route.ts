import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/preview-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: true, progress: null },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: true, progress: null },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: true, progress: null },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { data: memoryData, error: memoryError } = await supabaseAdmin
      .from('user_memory')
      .select('value')
      .eq('user_id', userData.id)
      .eq('memory_type', 'onboarding')
      .eq('key', 'progress')
      .single()

    if (memoryError && memoryError.code !== 'PGRST116') {
      throw memoryError
    }

    return NextResponse.json(
      {
        success: true,
        progress: memoryData?.value || null
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err: unknown) {
    console.error('Error fetching onboarding progress:', err)
    Sentry.captureException(err)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding progress' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: true, message: 'Onboarding progress saved (local only)' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: true, message: 'Onboarding progress saved (local only)' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const body = await req.json()

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: true, message: 'Onboarding progress saved (local only)' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { error: upsertError } = await supabaseAdmin
      .from('user_memory')
      .upsert({
        user_id: userData.id,
        memory_type: 'onboarding',
        key: 'progress',
        value: body,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,memory_type,key'
      })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Onboarding progress saved'
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err: unknown) {
    console.error('Error saving onboarding progress:', err)
    Sentry.captureException(err)
    return NextResponse.json(
      { error: 'Failed to save onboarding progress' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

