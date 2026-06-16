import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/preview-auth'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { FACELIFT_PREVIEW_MESSAGE, isFaceliftPreview } from '@/lib/facelift-preview'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = !isFaceliftPreview && SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function previewUnavailable() {
  return NextResponse.json({ error: FACELIFT_PREVIEW_MESSAGE }, { status: 503 })
}

export const dynamic = 'force-dynamic'

// GET - Fetch message metadata
export async function GET(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'metadata-read', 200, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const messageIds = searchParams.get('message_ids')?.split(',')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const campaignId = searchParams.get('campaign_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('message_metadata')
      .select(`
        *,
        email_campaigns (
          id,
          name,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (messageIds && messageIds.length > 0) {
      query = query.in('gmail_message_id', messageIds)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (priority) {
      query = query.eq('priority_level', priority)
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data: metadata, error } = await query

    if (error) {
      console.error('Error fetching metadata:', error)
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('message_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (messageIds && messageIds.length > 0) {
      countQuery = countQuery.in('gmail_message_id', messageIds)
    }
    if (category) countQuery = countQuery.eq('category', category)
    if (priority) countQuery = countQuery.eq('priority_level', priority)
    if (campaignId) countQuery = countQuery.eq('campaign_id', campaignId)

    const { count } = await countQuery

    return NextResponse.json({
      metadata,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    })
  } catch (error) {
    console.error('Message metadata GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update message metadata
export async function POST(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'metadata-write', 100, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { 
      gmail_message_id, 
      category, 
      priority_level, 
      custom_tags, 
      campaign_id,
      batch_updates 
    } = body

    // Handle batch updates
    if (batch_updates && Array.isArray(batch_updates)) {
      const validUpdates = batch_updates.filter(update => 
        update.gmail_message_id && 
        typeof update.gmail_message_id === 'string'
      ).map(update => ({
        user_id: userId,
        gmail_message_id: update.gmail_message_id,
        category: update.category || 'personal',
        priority_level: update.priority_level || 'medium',
        custom_tags: update.custom_tags || [],
        campaign_id: update.campaign_id || null
      }))

      if (validUpdates.length === 0) {
        return NextResponse.json(
          { error: 'No valid updates provided' },
          { status: 400 }
        )
      }

      const { data: metadata, error } = await supabase
        .from('message_metadata')
        .upsert(validUpdates, {
          onConflict: 'user_id,gmail_message_id'
        })
        .select()

      if (error) {
        console.error('Error batch updating metadata:', error)
        return NextResponse.json(
          { error: 'Failed to update metadata' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        updated: validUpdates.length,
        metadata 
      })
    }

    // Handle single update
    if (!gmail_message_id) {
      return NextResponse.json(
        { error: 'gmail_message_id is required' },
        { status: 400 }
      )
    }

    // Validate priority level
    if (priority_level && !['high', 'medium', 'low', 'none'].includes(priority_level)) {
      return NextResponse.json(
        { error: 'Invalid priority_level. Must be high, medium, low, or none' },
        { status: 400 }
      )
    }

    // Validate campaign exists if provided
    if (campaign_id) {
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('id')
        .eq('id', campaign_id)
        .eq('user_id', userId)
        .single()

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 400 }
        )
      }
    }

    const metadataUpdate = {
      user_id: userId,
      gmail_message_id,
      category: category || 'personal',
      priority_level: priority_level || 'medium',
      custom_tags: custom_tags || [],
      campaign_id: campaign_id || null
    }

    const { data: metadata, error } = await supabase
      .from('message_metadata')
      .upsert(metadataUpdate, {
        onConflict: 'user_id,gmail_message_id'
      })
      .select(`
        *,
        email_campaigns (
          id,
          name,
          status
        )
      `)
      .single()

    if (error) {
      console.error('Error updating metadata:', error)
      return NextResponse.json(
        { error: 'Failed to update metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({ metadata })
  } catch (error) {
    console.error('Message metadata POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove message metadata
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'metadata-write', 50, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('message_id')
    const messageIds = searchParams.get('message_ids')?.split(',')

    if (!messageId && !messageIds) {
      return NextResponse.json(
        { error: 'message_id or message_ids parameter is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('message_metadata')
      .delete()
      .eq('user_id', userId)

    if (messageId) {
      query = query.eq('gmail_message_id', messageId)
    } else if (messageIds) {
      query = query.in('gmail_message_id', messageIds)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting metadata:', error)
      return NextResponse.json(
        { error: 'Failed to delete metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Message metadata DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
