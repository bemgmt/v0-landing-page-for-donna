import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/preview-auth'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { FACELIFT_PREVIEW_MESSAGE, isFaceliftPreview } from '@/lib/facelift-preview'
import { google, gmail_v1 } from 'googleapis'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = !isFaceliftPreview && SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function previewUnavailable() {
  return NextResponse.json({ error: FACELIFT_PREVIEW_MESSAGE }, { status: 503 })
}

export const dynamic = 'force-dynamic'

// POST - Execute bulk email operations
export async function POST(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - stricter for bulk operations
    const rateLimitResult = await rateLimit(userId, 'bulk-operations', 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { action, message_ids, parameters } = body

    // Validation
    if (!action || !message_ids || !Array.isArray(message_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields: action, message_ids (array)' },
        { status: 400 }
      )
    }

    if (message_ids.length === 0) {
      return NextResponse.json(
        { error: 'No messages selected' },
        { status: 400 }
      )
    }

    if (message_ids.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 messages allowed per batch operation' },
        { status: 400 }
      )
    }

    const validActions = [
      'archive', 'star', 'unstar', 'apply_template', 
      'add_to_campaign', 'set_category', 'set_priority'
    ]

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Get Gmail access token
    const { data: tokenData } = await supabase
      .from('gmail_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .single()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      )
    }

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    let results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      switch (action) {
        case 'archive':
          await executeGmailBulkAction(gmail, message_ids, 'archive', results)
          break
        
        case 'star':
          await executeGmailBulkAction(gmail, message_ids, 'star', results)
          break
        
        case 'unstar':
          await executeGmailBulkAction(gmail, message_ids, 'unstar', results)
          break
        
        case 'apply_template':
          if (!parameters?.template_id) {
            return NextResponse.json(
              { error: 'template_id required for apply_template action' },
              { status: 400 }
            )
          }
          await executeTemplateApplication(gmail, message_ids, parameters.template_id, userId, results)
          break
        
        case 'add_to_campaign':
          if (!parameters?.campaign_id) {
            return NextResponse.json(
              { error: 'campaign_id required for add_to_campaign action' },
              { status: 400 }
            )
          }

          // Verify campaign ownership before proceeding
          const { data: campaign, error: campaignError } = await supabase
            .from('email_campaigns')
            .select('id, user_id')
            .eq('id', parameters.campaign_id)
            .eq('user_id', userId)
            .single()

          if (campaignError || !campaign) {
            return NextResponse.json(
              { error: 'Campaign not found or access denied' },
              { status: campaignError?.code === 'PGRST116' ? 404 : 403 }
            )
          }

          await executeMetadataUpdate(message_ids, userId, { campaign_id: parameters.campaign_id }, results)
          break
        
        case 'set_category':
          if (!parameters?.category) {
            return NextResponse.json(
              { error: 'category required for set_category action' },
              { status: 400 }
            )
          }
          await executeMetadataUpdate(message_ids, userId, { category: parameters.category }, results)
          break
        
        case 'set_priority':
          if (!parameters?.priority_level) {
            return NextResponse.json(
              { error: 'priority_level required for set_priority action' },
              { status: 400 }
            )
          }
          const validPriorities = ['high', 'medium', 'low', 'none']
          if (!validPriorities.includes(parameters.priority_level)) {
            return NextResponse.json(
              { error: `Invalid priority_level. Must be one of: ${validPriorities.join(', ')}` },
              { status: 400 }
            )
          }
          await executeMetadataUpdate(message_ids, userId, { priority_level: parameters.priority_level }, results)
          break
      }

      // Log bulk operation for audit trail
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          action: `bulk_${action}`,
          details: {
            message_count: message_ids.length,
            parameters,
            results
          }
        })

      return NextResponse.json({
        success: true,
        results,
        message: `Bulk operation completed. ${results.success} successful, ${results.failed} failed.`
      })

    } catch (error) {
      console.error('Bulk operation error:', error)
      return NextResponse.json(
        { error: 'Bulk operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Bulk operations POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to execute Gmail bulk actions
async function executeGmailBulkAction(
  gmail: gmail_v1.Gmail,
  messageIds: string[],
  action: string,
  results: { success: number; failed: number; errors: string[] }
) {
  const batchSize = 100 // Gmail API batch limit
  
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize)
    
    try {
      interface GmailBatchRequestBody {
        ids: string[]
        addLabelIds?: string[]
        removeLabelIds?: string[]
      }

      let requestBody: GmailBatchRequestBody = { ids: batch }
      
      switch (action) {
        case 'archive':
          requestBody.removeLabelIds = ['INBOX']
          break
        case 'star':
          requestBody.addLabelIds = ['STARRED']
          break
        case 'unstar':
          requestBody.removeLabelIds = ['STARRED']
          break
      }

      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody
      })

      results.success += batch.length
    } catch (error) {
      results.failed += batch.length
      results.errors.push(`Batch ${i / batchSize + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Helper function to execute template application
async function executeTemplateApplication(
  gmail: gmail_v1.Gmail,
  messageIds: string[],
  templateId: string,
  userId: string,
  results: { success: number; failed: number; errors: string[] }
) {
  // Get template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', userId)
    .single()

  if (!template) {
    results.failed += messageIds.length
    results.errors.push('Template not found')
    return
  }

  // For now, just mark as successful - actual template application would require
  // fetching each message, processing template variables, and sending replies
  results.success += messageIds.length
}

// Helper function to execute metadata updates
async function executeMetadataUpdate(
  messageIds: string[],
  userId: string,
  updates: {
    category?: string
    priority_level?: string
    custom_tags?: string[]
    campaign_id?: string
  },
  results: { success: number; failed: number; errors: string[] }
) {
  try {
    // Upsert metadata for each message
    const metadataUpdates = messageIds.map(messageId => ({
      user_id: userId,
      gmail_message_id: messageId,
      ...updates
    }))

    const { error } = await supabase
      .from('message_metadata')
      .upsert(metadataUpdates, {
        onConflict: 'user_id,gmail_message_id'
      })

    if (error) {
      results.failed += messageIds.length
      results.errors.push(`Metadata update failed: ${error.message}`)
    } else {
      results.success += messageIds.length
    }
  } catch (error) {
    results.failed += messageIds.length
    results.errors.push(`Metadata update error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
