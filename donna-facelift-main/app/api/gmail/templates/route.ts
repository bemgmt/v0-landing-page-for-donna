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

// GET - Fetch user's email templates
export async function GET(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'templates-read', 100, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type')

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (templateType && ['personal', 'campaign'].includes(templateType)) {
      query = query.eq('template_type', templateType)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'templates-write', 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, subject_template, body_template, template_type, variables } = body

    // Validation
    if (!name || !subject_template || !body_template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject_template, body_template' },
        { status: 400 }
      )
    }

    if (!['personal', 'campaign'].includes(template_type)) {
      return NextResponse.json(
        { error: 'Invalid template_type. Must be "personal" or "campaign"' },
        { status: 400 }
      )
    }

    // Validate template variables
    const templateVariables = extractTemplateVariables(subject_template + ' ' + body_template)
    const providedVariables = variables || {}
    
    // Ensure all template variables have descriptions
    for (const variable of templateVariables) {
      if (!providedVariables[variable]) {
        providedVariables[variable] = { description: `Variable: ${variable}`, required: true }
      }
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        user_id: userId,
        name: name.trim(),
        subject_template: subject_template.trim(),
        body_template: body_template.trim(),
        template_type,
        variables: providedVariables
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing template
export async function PUT(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'templates-write', 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { id, name, subject_template, body_template, template_type, variables } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Validation
    if (!name || !subject_template || !body_template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject_template, body_template' },
        { status: 400 }
      )
    }

    if (!['personal', 'campaign'].includes(template_type)) {
      return NextResponse.json(
        { error: 'Invalid template_type. Must be "personal" or "campaign"' },
        { status: 400 }
      )
    }

    // Validate template variables
    const templateVariables = extractTemplateVariables(subject_template + ' ' + body_template)
    const providedVariables = variables || {}
    
    for (const variable of templateVariables) {
      if (!providedVariables[variable]) {
        providedVariables[variable] = { description: `Variable: ${variable}`, required: true }
      }
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        name: name.trim(),
        subject_template: subject_template.trim(),
        body_template: body_template.trim(),
        template_type,
        variables: providedVariables
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Templates PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove template
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) return previewUnavailable()

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'templates-write', 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to extract template variables from text
function extractTemplateVariables(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    const variable = match[1].trim()
    if (!variables.includes(variable)) {
      variables.push(variable)
    }
  }

  return variables
}
