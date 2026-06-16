import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { FACELIFT_PREVIEW_MESSAGE, isFaceliftPreview } from '@/lib/facelift-preview'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = !isFaceliftPreview && SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const dynamic = 'force-dynamic'

/**
 * GET handler that lists Gmail messages for the authenticated Clerk user with enhanced filtering and metadata.
 *
 * Retrieves the stored Gmail refresh token from Supabase using RLS, exchanges it via a Google OAuth2 client,
 * and returns enhanced Gmail messages with metadata, filtering, and statistics. Response includes `Cache-Control: no-store`.
 *
 * Query Parameters:
 * - maxResults: Number of messages to return (default: 50, max: 500)
 * - pageToken: Token for pagination
 * - q: Gmail search query
 * - label: Filter by Gmail label
 * - category: Filter by message category (personal, business, marketing, etc.)
 * - priority: Filter by priority level (high, medium, low, none)
 * - campaign_id: Filter by campaign ID
 * - tags: Comma-separated list of tags to filter by
 * - sort: Sort order (date, priority, category)
 *
 * Responses:
 * - 200: JSON payload with messages, metadata, statistics, and pagination info
 * - 401: when there is no authenticated Clerk user.
 * - 500: when server is misconfigured or on other internal errors.
 *
 * Requirements / side effects:
 * - Reads from Supabase tables `gmail_tokens`, `message_metadata`, and `email_campaigns` using RLS
 * - Requires environment variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
 * - Calls Google Gmail API using the stored refresh token.
 * - Errors are logged and reported to Sentry.
 */
export async function GET(request: Request) {
  try {
    if (!supabase) {
      return new Response(FACELIFT_PREVIEW_MESSAGE, { status: 503 })
    }

    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 1. Get Gmail access token (RLS will ensure user can only access their own tokens)
    // Map Clerk user to internal users.id, then fetch gmail_tokens by user_id
    const { data: u } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!u) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('refresh_token')
      .eq('user_id', u.id)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('Gmail tokens not found for this user.')
    }

    // 3. Create OAuth2 client and set credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      throw new Error('Missing Google OAuth configuration')
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token,
    })

    // 4. Parse query parameters for enhanced filtering
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const priority = url.searchParams.get('priority')
    const campaignId = url.searchParams.get('campaign_id')
    const tags = url.searchParams.get('tags')?.split(',')
    const maxResults = parseInt(url.searchParams.get('maxResults') || url.searchParams.get('limit') || '50')
    const pageToken = url.searchParams.get('pageToken')
    const q = url.searchParams.get('q') // Gmail search query
    const sortBy = url.searchParams.get('sort') || 'date'

    // 5. Build Gmail query with filters
    let gmailQuery = q || ''

    // Add label-based filtering if specified
    if (url.searchParams.get('label')) {
      gmailQuery += ` label:${url.searchParams.get('label')}`
    }

    // List messages with enhanced parameters
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    interface GmailListParams {
      userId: string
      maxResults: number
      includeSpamTrash: boolean
      q?: string
      pageToken?: string
    }

    const listParams: GmailListParams = {
      userId: 'me',
      maxResults: Math.min(maxResults, 500), // Cap at 500 for performance
      includeSpamTrash: false
    }

    if (gmailQuery.trim()) {
      listParams.q = gmailQuery.trim()
    }

    if (pageToken) {
      listParams.pageToken = pageToken
    }

    const list = await gmail.users.messages.list(listParams)

    // 6. Get message metadata from our database
    let messagesWithMetadata = list.data.messages || []

    if (messagesWithMetadata.length > 0) {
      const messageIds = messagesWithMetadata.map(m => m.id).filter(Boolean)

      // Fetch metadata for these messages
      let metadataQuery = supabase
        .from('message_metadata')
        .select(`
          gmail_message_id,
          category,
          priority_level,
          custom_tags,
          campaign_id,
          email_campaigns (
            id,
            name,
            status
          )
        `)
        .eq('user_id', u.id)
        .in('gmail_message_id', messageIds)

      // Apply metadata filters
      if (category) {
        metadataQuery = metadataQuery.eq('category', category)
      }
      if (priority) {
        metadataQuery = metadataQuery.eq('priority_level', priority)
      }
      if (campaignId) {
        metadataQuery = metadataQuery.eq('campaign_id', campaignId)
      }

      const { data: metadata } = await metadataQuery

      // Create metadata lookup map
      const metadataMap = new Map()
      metadata?.forEach(m => {
        metadataMap.set(m.gmail_message_id, m)
      })

      // Enhance messages with metadata
      messagesWithMetadata = messagesWithMetadata.map(message => ({
        ...message,
        metadata: metadataMap.get(message.id) || null
      }))

      // Apply client-side filtering for metadata-based filters
      if (category || priority || campaignId || tags) {
        messagesWithMetadata = messagesWithMetadata.filter(message => {
          const meta = message.metadata
          if (!meta) return false

          if (category && meta.category !== category) return false
          if (priority && meta.priority_level !== priority) return false
          if (campaignId && meta.campaign_id !== campaignId) return false
          if (tags && tags.length > 0) {
            const messageTags = meta.custom_tags || []
            if (!tags.some(tag => messageTags.includes(tag))) return false
          }

          return true
        })
      }

      // Apply sorting
      if (sortBy === 'priority') {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 }
        messagesWithMetadata.sort((a, b) => {
          const aPriority = priorityOrder[a.metadata?.priority_level || 'none']
          const bPriority = priorityOrder[b.metadata?.priority_level || 'none']
          return bPriority - aPriority
        })
      } else if (sortBy === 'category') {
        messagesWithMetadata.sort((a, b) => {
          const aCategory = a.metadata?.category || 'personal'
          const bCategory = b.metadata?.category || 'personal'
          return aCategory.localeCompare(bCategory)
        })
      }
    }

    // 7. Calculate statistics
    const stats = {
      total: list.data.resultSizeEstimate || 0,
      unread: 0,
      by_category: {} as Record<string, number>,
      by_priority: {} as Record<string, number>
    }

    // Get category and priority statistics
    const { data: categoryStats } = await supabase
      .from('message_metadata')
      .select('category, priority_level')
      .eq('user_id', u.id)

    categoryStats?.forEach(stat => {
      stats.by_category[stat.category] = (stats.by_category[stat.category] || 0) + 1
      stats.by_priority[stat.priority_level] = (stats.by_priority[stat.priority_level] || 0) + 1
    })

    return new NextResponse(
      JSON.stringify({
        success: true,
        messages: messagesWithMetadata,
        stats,
        nextPageToken: list.data.nextPageToken || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[API GMAIL MESSAGES ERROR]', error)
    Sentry.captureException(error)
    return new Response(JSON.stringify({ success: false, error: 'Failed to list messages' }), { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

