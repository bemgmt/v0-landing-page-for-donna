import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/preview-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const widgetSchema = z.object({
  id: z.string(),
  type: z.enum(['stat', 'table', 'chart']),
  customName: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

const configSchema = z.object({
  widgets: z.array(widgetSchema),
  vertical: z.string().optional(),
  widgetType: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: true, config: null },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const { searchParams } = new URL(req.url)
    const vertical = searchParams.get('vertical')

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: true, config: null },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const key = vertical ? `${vertical}_custom` : 'default_custom'
    const { data: memoryData, error: memoryError } = await supabaseAdmin
      .from('user_memory')
      .select('value')
      .eq('user_id', userData.id)
      .eq('memory_type', 'dashboard_config')
      .eq('key', key)
      .single()

    if (memoryError && memoryError.code !== 'PGRST116') {
      throw memoryError
    }

    const config = memoryData?.value ?? null
    return NextResponse.json(
      { success: true, config },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err: unknown) {
    console.error('Error fetching dashboard config:', err)
    Sentry.captureException(err)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard config' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: true, message: 'Dashboard config saved (local only)' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const body = await req.json()
    const parsed = configSchema.parse(body)
    const vertical = parsed.vertical ?? 'default'
    const key = `${vertical}_custom`

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: true, message: 'Dashboard config saved (local only)' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { error: upsertError } = await supabaseAdmin
      .from('user_memory')
      .upsert({
        user_id: userData.id,
        memory_type: 'dashboard_config',
        key,
        value: { widgets: parsed.widgets },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,memory_type,key',
      })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json(
      { success: true, message: 'Dashboard config saved' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.errors },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    console.error('Error saving dashboard config:', err)
    Sentry.captureException(err)
    return NextResponse.json(
      { error: 'Failed to save dashboard config' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
