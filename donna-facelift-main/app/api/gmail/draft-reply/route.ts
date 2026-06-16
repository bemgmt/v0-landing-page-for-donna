
import { auth } from '@/lib/preview-auth'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import OpenAI from 'openai'
import { chooseAgentModel } from '@/lib/model-router'
import { createClient } from '@supabase/supabase-js'
import { FACELIFT_PREVIEW_MESSAGE, isFaceliftPreview } from '@/lib/facelift-preview'
import type { gmail_v1 } from 'googleapis'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = !isFaceliftPreview && SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Decode base64url (Gmail) to UTF-8 string
function decodeBase64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(data.length / 4) * 4, '=')
  return Buffer.from(b64, 'base64').toString('utf-8')
}

// Helper function to extract email content.
// This mirrors the frontend logic but is adapted for the backend.
function getEmailContent(message: gmail_v1.Schema$Message): { subject: string, from: string, body: string, snippet: string } {
  const payload = message.payload
  const headers = (payload?.headers || []) as gmail_v1.Schema$MessagePartHeader[]
  
  const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || ''
  const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || ''
  const snippet = message.snippet || ''

  let body = ''
  const parts = payload?.parts as gmail_v1.Schema$MessagePart[] | undefined
  if (parts && parts.length) {
    const part = parts.find((p) => p.mimeType === 'text/plain') || parts.find((p) => p.mimeType === 'text/html')
    const data = part?.body?.data
    if (data) {
      body = decodeBase64Url(data)
    }
  } else if (payload?.body?.data) {
    {
      const data = payload.body.data
      body = decodeBase64Url(data)
    }
  }

  // Basic HTML tag stripping for plain text context
  if (/<[a-z][\s\S]*>/i.test(body)) {
    body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<[^>]+>/g, '\n')
               .replace(/\n{2,}/g, '\n')
  }
  const MAX = 16000
  if (body.length > MAX) body = body.slice(0, MAX) + '\n...[truncated]'

  return { subject, from, body, snippet }
}


export async function POST(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: FACELIFT_PREVIEW_MESSAGE }, { status: 503 })
    }

    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const bodyJson = await req.json().catch(() => ({})) as Partial<{
      message: gmail_v1.Schema$Message;
      goal: string;
      tone?: 'professional' | 'friendly' | 'casual';
      length?: 'short' | 'medium' | 'long';
      include_cta?: boolean;
      cta_type?: 'meeting' | 'call' | 'demo' | 'custom';
      template_id?: string;
      marketing_goal?: string;
    }>
    const {
      message,
      goal,
      tone = 'professional',
      length = 'medium',
      include_cta = false,
      cta_type = 'meeting',
      template_id,
      marketing_goal
    } = bodyJson

    if (!message || !goal) {
      return NextResponse.json({ error: 'Missing message or goal' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const { subject, from, body, snippet } = getEmailContent(message)

    // Handle template-based replies
    let templateContent = ''
    if (template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', template_id)
        .eq('user_id', userId)
        .single()

      if (template) {
        templateContent = `\n\nTemplate to use as a base:\nSubject: ${template.subject_template}\nBody: ${template.body_template}\n\nPlease adapt this template to respond to the email while achieving the goal.`
      }
    }

    // Build enhanced system prompt based on tone and marketing focus
    const toneInstructions = {
      professional: 'Maintain a formal, business-appropriate tone. Use proper grammar and avoid casual language.',
      friendly: 'Use a warm, approachable tone while remaining professional. Include personal touches where appropriate.',
      casual: 'Write in a relaxed, conversational style. Use contractions and informal language where suitable.'
    }

    const lengthInstructions = {
      short: 'Keep the response brief and to the point, ideally 2-3 sentences.',
      medium: 'Write a moderate-length response, typically 1-2 paragraphs.',
      long: 'Provide a comprehensive response with detailed explanations, typically 3-4 paragraphs.'
    }

    const ctaInstructions = include_cta ? {
      meeting: 'Include a clear call-to-action to schedule a meeting or call.',
      call: 'Include a call-to-action to schedule a phone call or video chat.',
      demo: 'Include a call-to-action to schedule a product demo or presentation.',
      custom: 'Include a relevant call-to-action based on the context and goal.'
    }[cta_type] : ''

    const systemPrompt = `You are Donna, a highly intelligent and efficient AI assistant specializing in business email communications. Your personality is ${tone}, and proactive. You are tasked with helping users manage their email communications effectively.

    TONE: ${toneInstructions[tone]}
    LENGTH: ${lengthInstructions[length]}
    ${ctaInstructions ? `CALL-TO-ACTION: ${ctaInstructions}` : ''}
    ${marketing_goal ? `MARKETING FOCUS: ${marketing_goal}` : ''}

    Your goal is to draft a reply that perfectly aligns with the user's stated objective, while maintaining a natural, human-like tone. You should handle objections, be persuasive when needed, and know when to suggest escalating to a human.`;

    const userPrompt = `
      My goal for this reply is: "${goal}"
      ${marketing_goal ? `Marketing objective: "${marketing_goal}"` : ''}

      Here is the email I received:
      ---
      From: ${from}
      Subject: ${subject}

      Content:
      ${body || snippet}
      ---
      ${templateContent}

      Please draft an effective reply that achieves my goal. Do not include a subject line, just the body of the email.
    `;

    const inputChars = (body || snippet || '').length
    const expectedTokens = length === 'short' ? 200 : length === 'medium' ? 500 : 800
    const model = chooseAgentModel({
      critical: true, // customer-facing email
      inputChars,
      expectedTokens,
    })

    // Check cache for similar requests
    const cacheKey = `draft_${userId}_${JSON.stringify({ goal, tone, length, include_cta, cta_type, marketing_goal })}`

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: expectedTokens,
    });

    const draft = response.choices[0].message.content;

    // Log the AI draft generation for analytics and improvement
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          action: 'draft_ai_reply',
          details: {
            message_id: message.id,
            goal,
            tone,
            length,
            include_cta,
            cta_type,
            template_id,
            marketing_goal,
            model_used: model,
            draft_length: draft?.length || 0
          }
        })
    } catch (logError) {
      console.error('Error logging draft generation:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      draft,
      metadata: {
        tone,
        length,
        include_cta,
        cta_type,
        model_used: model
      }
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (err: unknown) {
    console.error("Error in draft-reply route:", err);
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
