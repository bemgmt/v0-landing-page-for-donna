import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/preview-auth'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { FACELIFT_PREVIEW_MESSAGE, isFaceliftPreview } from '@/lib/facelift-preview'
import { EmailSequenceStep } from '@/types/email'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = !isFaceliftPreview && SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function previewUnavailable() {
  return NextResponse.json({ error: FACELIFT_PREVIEW_MESSAGE }, { status: 503 })
}

export const dynamic = 'force-dynamic'

// GET - Fetch user's email campaigns
export async function GET(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'campaigns-read', 100, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('email_campaigns')
      .select(`
        *,
        campaign_email_steps (
          id,
          step_number,
          delay_days,
          subject_template,
          body_template,
          trigger_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && ['draft', 'active', 'paused', 'completed'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // Calculate campaign statistics with batched queries to avoid N+1
    const campaignIds = campaigns.map(c => c.id)

    // Batch query for message counts grouped by campaign_id
    const { data: messageCounts } = await supabase
      .from('message_metadata')
      .select('campaign_id')
      .eq('user_id', userId)
      .in('campaign_id', campaignIds)

    // Batch query for email logs grouped by campaign_id and action
    const { data: emailLogs } = await supabase
      .from('email_logs')
      .select('action, details')
      .eq('user_id', userId)
      .or(campaignIds.map(id => `details->>campaign_id.eq.${id}`).join(','))

    // Build maps for efficient lookup
    const messageCountMap = new Map<string, number>()
    messageCounts?.forEach(record => {
      if (record.campaign_id) {
        messageCountMap.set(record.campaign_id, (messageCountMap.get(record.campaign_id) || 0) + 1)
      }
    })

    const emailStatsMap = new Map<string, { sent: number; replies: number }>()
    emailLogs?.forEach(log => {
      const campaignId = log.details?.campaign_id
      if (campaignId) {
        const stats = emailStatsMap.get(campaignId) || { sent: 0, replies: 0 }
        if (log.action === 'send_email') stats.sent++
        if (log.action === 'reply_to_email') stats.replies++
        emailStatsMap.set(campaignId, stats)
      }
    })

    // Merge statistics into campaigns
    const campaignsWithStats = campaigns.map(campaign => {
      const messageCount = messageCountMap.get(campaign.id) || 0
      const emailStats = emailStatsMap.get(campaign.id) || { sent: 0, replies: 0 }

      return {
        ...campaign,
        statistics: {
          emails_sent: emailStats.sent,
          replies: emailStats.replies,
          messages_in_campaign: messageCount,
          open_rate: emailStats.sent > 0 ? Math.round((emailStats.replies / emailStats.sent) * 100) : 0
        }
      }
    })

    // Get total count for pagination
    let countQuery = supabase
      .from('email_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (status && ['draft', 'active', 'paused', 'completed'].includes(status)) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      campaigns: campaignsWithStats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    })
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new email campaign
export async function POST(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'campaigns-write', 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, description, target_label, email_sequence, steps } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      )
    }

    if (!target_label) {
      return NextResponse.json(
        { error: 'Target label is required' },
        { status: 400 }
      )
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || '',
        target_label: target_label.trim(),
        email_sequence: email_sequence || [],
        status: 'draft'
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    // Create campaign steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const campaignSteps = steps.map((step, index) => ({
        campaign_id: campaign.id,
        step_number: index + 1,
        delay_days: step.delay_days || 0,
        subject_template: step.subject_template || '',
        body_template: step.body_template || '',
        trigger_type: step.trigger_type || 'time'
      }))

      const { error: stepsError } = await supabase
        .from('campaign_email_steps')
        .insert(campaignSteps)

      if (stepsError) {
        console.error('Error creating campaign steps:', stepsError)
        // Don't fail the entire operation, just log the error
      }
    }

    // Fetch the complete campaign with steps
    const { data: completeCampaign } = await supabase
      .from('email_campaigns')
      .select(`
        *,
        campaign_email_steps (
          id,
          step_number,
          delay_days,
          subject_template,
          body_template,
          trigger_type
        )
      `)
      .eq('id', campaign.id)
      .single()

    return NextResponse.json({ campaign: completeCampaign }, { status: 201 })
  } catch (error) {
    console.error('Campaigns POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing campaign
export async function PUT(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'campaigns-write', 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { id, name, description, status, target_label, email_sequence } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Validation
    if (status && !['draft', 'active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be draft, active, paused, or completed' },
        { status: 400 }
      )
    }

    interface CampaignUpdateData {
      name?: string
      description?: string
      status?: string
      target_label?: string
      email_sequence?: EmailSequenceStep[]
    }

    const updateData: CampaignUpdateData = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || ''
    if (status) updateData.status = status
    if (target_label) updateData.target_label = target_label.trim()
    if (email_sequence) updateData.email_sequence = email_sequence

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        campaign_email_steps (
          id,
          step_number,
          delay_days,
          subject_template,
          body_template,
          trigger_type
        )
      `)
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      )
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Campaigns PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove campaign
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'campaigns-write', 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Check if campaign exists and belongs to user
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of active campaigns
    if (campaign.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active campaign. Please pause it first.' },
        { status: 400 }
      )
    }

    // Delete campaign (steps will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting campaign:', error)
      return NextResponse.json(
        { error: 'Failed to delete campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaigns DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
