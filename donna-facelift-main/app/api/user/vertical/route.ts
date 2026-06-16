import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { parseJson, isBadRequestError } from '@/lib/http-parse'
import { isValidVertical, ALLOWED_VERTICALS } from '@/lib/constants/verticals'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' } as const

export async function POST(req: Request) {
  try {
    const schema = z.object({ 
      vertical: z.string().refine((val) => isValidVertical(val), {
        message: `Vertical must be one of: ${ALLOWED_VERTICALS.join(', ')}`
      })
    })
    const { vertical } = await parseJson(req, schema)

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: true, vertical, message: 'Saved locally (not authenticated)' },
        { headers: NO_STORE }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: true, vertical, message: 'Saved locally (database unavailable)' },
        { headers: NO_STORE }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({ clerk_id: clerkId, vertical }, { onConflict: 'clerk_id' })
        .select('id')
        .single()

    if (userError || !userData) {
        console.error('Supabase upsert error in vertical POST:', userError)
        return NextResponse.json(
          { error: userError?.message || 'Failed to save vertical selection' },
          { status: 500, headers: NO_STORE }
        )
    }

    return NextResponse.json({ success: true, vertical }, { headers: NO_STORE })

  } catch (err: unknown) {
    if (isBadRequestError(err)) {
      return NextResponse.json({ error: err.message }, { status: 400, headers: NO_STORE })
    }
    console.error('Error in vertical route:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to update vertical' }, { status: 500, headers: NO_STORE })
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: true, vertical: null },
        { headers: NO_STORE }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: true, vertical: null },
        { headers: NO_STORE }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('vertical')
        .eq('clerk_id', clerkId)
        .single()

    if (userError || !userData) {
        return NextResponse.json(
          { success: true, vertical: null },
          { headers: NO_STORE }
        )
    }

    return NextResponse.json(
      { success: true, vertical: userData.vertical || null },
      { headers: NO_STORE }
    )

  } catch (err: unknown) {
    console.error('Error in get vertical route:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to retrieve vertical' }, { status: 500, headers: NO_STORE })
  }
}

