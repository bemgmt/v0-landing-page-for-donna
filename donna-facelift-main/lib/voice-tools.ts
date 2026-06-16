// Import tool - handle missing package gracefully
import { tool } from '@openai/agents-realtime'

const apiBase = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE || '') : '')

type PostJsonResponse = unknown
async function postJson(path: string, payload: unknown): Promise<PostJsonResponse> {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  try { return await res.json() } catch { return { ok: res.ok } as unknown }
}

type SendEmailInput = { to: string; subject: string; body: string }
export const sendEmailTool = tool({
  name: 'send_email',
  description: 'Send an email to a contact with a subject and body.',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email message body' },
    },
    required: ['to', 'subject', 'body'],
    additionalProperties: false
  },
  async execute(input: unknown) {
    const { to, subject, body } = (input || {}) as Partial<SendEmailInput>
    await postJson('/api/sales/overview.php', { action: 'send_email', email: { to, subject, body } })
    return `Email queued to ${to} with subject "${subject}".`
  }
})

type SendTextInput = { to: string; message: string }
export const sendTextTool = tool({
  name: 'send_text',
  description: 'Send an SMS/text message to a phone number.',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient phone number in E.164 if possible' },
      message: { type: 'string', description: 'SMS message body' },
    },
    required: ['to', 'message'],
    additionalProperties: false
  },
  async execute(input: unknown) {
    const { to, message } = (input || {}) as Partial<SendTextInput>
    await postJson('/api/sales/overview.php', { action: 'send_text', sms: { to, message } })
    return `Text queued to ${to}.`
  }
})

type LogNoteInput = { note: string; category?: 'marketing'|'sales'|'secretary'|'general' }
export const logNoteTool = tool({
  name: 'log_conversation_note',
  description: 'Log a conversation note to be visible in dashboards.',
  parameters: {
    type: 'object',
    properties: {
      note: { type: 'string', description: 'Note text to log' },
      category: { type: 'string', description: 'Optional category like marketing, sales, secretary', enum: ['marketing','sales','secretary','general'] },
    },
    required: ['note'],
    additionalProperties: false
  },
  async execute(input: unknown) {
    const { note, category } = (input || {}) as Partial<LogNoteInput>
    await postJson('/api/sales/overview.php', { action: 'log_note', note, category: category || 'general' })
    return `Logged note (${category || 'general'}).`
  }
})

type AddContactInput = { name?: string; email?: string; phone?: string; source?: string }
export const addContactTool = tool({
  name: 'add_contact',
  description: 'Create or update a contact/lead.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Full name' },
      email: { type: 'string', description: 'Email address' },
      phone: { type: 'string', description: 'Phone number' },
      source: { type: 'string', description: 'Lead source', default: 'voice' },
    },
    required: [],
    additionalProperties: false
  },
  async execute(input: unknown) {
    const { name, email, phone, source } = (input || {}) as Partial<AddContactInput>
    await postJson('/api/sales/overview.php', { action: 'add_contact', contact: { name, email, phone, source: source || 'voice' } })
    return `Contact saved${name ? `: ${name}` : ''}.`
  }
})

export const voiceTools = [sendEmailTool, sendTextTool, logNoteTool, addContactTool]

