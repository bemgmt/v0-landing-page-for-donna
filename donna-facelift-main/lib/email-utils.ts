import { EmailCategory, PriorityLevel, TemplateVariableMap, ProcessedTemplate } from '@/types/email'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function for combining classes (from existing utils)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Replace template variables in text with provided values
 * Supports {{variable}} syntax with proper escaping
 */
export function replaceTemplateVariables(
  text: string, 
  variables: TemplateVariableMap
): ProcessedTemplate {
  const variableRegex = /\{\{([^}]+)\}\}/g
  const variablesUsed: string[] = []
  const missingVariables: string[] = []
  
  const processedText = text.replace(variableRegex, (match, variableName) => {
    const trimmedName = variableName.trim()
    variablesUsed.push(trimmedName)
    
    if (variables[trimmedName] !== undefined) {
      return String(variables[trimmedName])
    } else {
      missingVariables.push(trimmedName)
      return match // Keep original placeholder if variable not provided
    }
  })
  
  return {
    subject: processedText,
    body: processedText,
    variables_used: [...new Set(variablesUsed)],
    missing_variables: [...new Set(missingVariables)]
  }
}

/**
 * Extract template variables from text
 */
export function extractTemplateVariables(text: string): string[] {
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

/**
 * Categorize email based on content analysis and sender
 */
export function categorizeEmail(
  subject: string,
  body: string,
  sender: string,
  existingLabels: string[] = []
): EmailCategory {
  const content = (subject + ' ' + body).toLowerCase()
  const senderLower = sender.toLowerCase()
  
  // Check existing Gmail labels first
  if (existingLabels.some(label => label.toLowerCase().includes('marketing'))) {
    return 'marketing'
  }
  if (existingLabels.some(label => label.toLowerCase().includes('sales'))) {
    return 'sales'
  }
  if (existingLabels.some(label => label.toLowerCase().includes('support'))) {
    return 'support'
  }
  
  // Marketing keywords
  const marketingKeywords = [
    'newsletter', 'promotion', 'sale', 'discount', 'offer', 'deal',
    'marketing', 'campaign', 'unsubscribe', 'click here', 'limited time',
    'exclusive', 'special offer', 'free shipping', 'coupon'
  ]
  
  // Sales keywords
  const salesKeywords = [
    'proposal', 'quote', 'pricing', 'demo', 'meeting', 'call',
    'opportunity', 'lead', 'prospect', 'sales', 'revenue',
    'contract', 'agreement', 'purchase', 'buy'
  ]
  
  // Support keywords
  const supportKeywords = [
    'support', 'help', 'issue', 'problem', 'bug', 'error',
    'ticket', 'assistance', 'troubleshoot', 'fix', 'resolve',
    'question', 'inquiry', 'how to'
  ]
  
  // Check for keyword matches
  if (marketingKeywords.some(keyword => content.includes(keyword))) {
    return 'marketing'
  }
  if (salesKeywords.some(keyword => content.includes(keyword))) {
    return 'sales'
  }
  if (supportKeywords.some(keyword => content.includes(keyword))) {
    return 'support'
  }
  
  // Check sender patterns
  if (senderLower.includes('noreply') || senderLower.includes('no-reply')) {
    return 'marketing'
  }
  if (senderLower.includes('support') || senderLower.includes('help')) {
    return 'support'
  }
  if (senderLower.includes('sales') || senderLower.includes('business')) {
    return 'sales'
  }
  
  return 'personal'
}

/**
 * Detect email priority based on content analysis
 */
export function detectEmailPriority(
  subject: string,
  body: string,
  sender: string,
  isImportantSender: boolean = false
): PriorityLevel {
  const content = (subject + ' ' + body).toLowerCase()
  const subjectLower = subject.toLowerCase()
  
  // High priority indicators
  const highPriorityKeywords = [
    'urgent', 'asap', 'emergency', 'critical', 'immediate',
    'deadline', 'time sensitive', 'action required', 'important',
    'priority', 'escalation', 'issue', 'problem', 'down'
  ]
  
  // Low priority indicators
  const lowPriorityKeywords = [
    'fyi', 'for your information', 'newsletter', 'update',
    'notification', 'reminder', 'weekly', 'monthly', 'digest'
  ]
  
  // Check for high priority indicators
  if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
    return PriorityLevel.HIGH
  }
  
  // Check subject line patterns
  if (subjectLower.includes('re:') && subjectLower.includes('urgent')) {
    return PriorityLevel.HIGH
  }
  
  if (subjectLower.startsWith('urgent:') || subjectLower.startsWith('important:')) {
    return PriorityLevel.HIGH
  }
  
  // Check for low priority indicators
  if (lowPriorityKeywords.some(keyword => content.includes(keyword))) {
    return PriorityLevel.LOW
  }
  
  // Important sender gets medium priority by default
  if (isImportantSender) {
    return PriorityLevel.MEDIUM
  }
  
  return PriorityLevel.MEDIUM
}

/**
 * Format email for consistent display
 */
export function formatEmailDisplay(email: any) {
  const headers = email.payload?.headers || []
  const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)'
  const from = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender'
  const date = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value || email.internalDate
  
  return {
    id: email.id,
    subject: subject.length > 100 ? subject.substring(0, 100) + '...' : subject,
    from: formatSenderName(from),
    date: formatEmailDate(date),
    snippet: email.snippet || '',
    isUnread: email.labelIds?.includes('UNREAD') || false,
    isStarred: email.labelIds?.includes('STARRED') || false,
    hasAttachments: hasEmailAttachments(email)
  }
}

/**
 * Format sender name for display
 */
export function formatSenderName(from: string): string {
  // Extract name from "Name <email@domain.com>" format
  const nameMatch = from.match(/^(.+?)\s*<.+>$/)
  if (nameMatch) {
    return nameMatch[1].replace(/['"]/g, '').trim()
  }
  
  // If just email, extract username part
  const emailMatch = from.match(/^([^@]+)@/)
  if (emailMatch) {
    return emailMatch[1].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return from
}

/**
 * Format email date for display
 */
export function formatEmailDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  } catch {
    return 'Unknown'
  }
}

/**
 * Check if email has attachments
 */
export function hasEmailAttachments(email: any): boolean {
  const payload = email.payload
  if (!payload) return false
  
  // Check if any part has attachment
  const checkParts = (parts: any[]): boolean => {
    return parts.some(part => {
      if (part.filename && part.filename.length > 0) return true
      if (part.parts) return checkParts(part.parts)
      return false
    })
  }
  
  if (payload.parts) {
    return checkParts(payload.parts)
  }
  
  return false
}

/**
 * Validate template syntax
 */
export function validateTemplate(subject: string, body: string): {
  isValid: boolean
  errors: string[]
  variables: string[]
} {
  const errors: string[] = []
  const allVariables: string[] = []
  
  // Extract variables from both subject and body
  const subjectVars = extractTemplateVariables(subject)
  const bodyVars = extractTemplateVariables(body)
  allVariables.push(...subjectVars, ...bodyVars)
  
  // Check for malformed variable syntax
  const malformedRegex = /\{[^}]*\}|\{[^{]*\{\{/g
  const subjectMalformed = subject.match(malformedRegex)
  const bodyMalformed = body.match(malformedRegex)
  
  if (subjectMalformed) {
    errors.push(`Malformed variables in subject: ${subjectMalformed.join(', ')}`)
  }
  if (bodyMalformed) {
    errors.push(`Malformed variables in body: ${bodyMalformed.join(', ')}`)
  }
  
  // Check for empty variable names
  const emptyVarRegex = /\{\{\s*\}\}/g
  if (subject.match(emptyVarRegex) || body.match(emptyVarRegex)) {
    errors.push('Empty variable names found ({{}})')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    variables: [...new Set(allVariables)]
  }
}

/**
 * Calculate email statistics
 */
export function calculateEmailStats(emails: any[], metadata: any[]) {
  const stats = {
    total: emails.length,
    unread: 0,
    by_category: {} as Record<string, number>,
    by_priority: {} as Record<string, number>
  }
  
  // Count unread emails
  stats.unread = emails.filter(email => 
    email.labelIds?.includes('UNREAD')
  ).length
  
  // Count by category and priority from metadata
  metadata.forEach(meta => {
    const category = meta.category || 'personal'
    const priority = meta.priority_level || 'medium'
    
    stats.by_category[category] = (stats.by_category[category] || 0) + 1
    stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1
  })
  
  return stats
}

/**
 * Search and filter emails
 */
export function filterEmails(emails: any[], filters: any) {
  return emails.filter(email => {
    // Apply various filters based on the filters object
    if (filters.category && email.metadata?.category !== filters.category) {
      return false
    }
    
    if (filters.priority && email.metadata?.priority_level !== filters.priority) {
      return false
    }
    
    if (filters.campaign_id && email.metadata?.campaign_id !== filters.campaign_id) {
      return false
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const emailTags = email.metadata?.custom_tags || []
      if (!filters.tags.some((tag: string) => emailTags.includes(tag))) {
        return false
      }
    }
    
    if (filters.query) {
      const searchText = (email.subject + ' ' + email.snippet + ' ' + email.from).toLowerCase()
      if (!searchText.includes(filters.query.toLowerCase())) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Remove email signature from content
 */
export function removeEmailSignature(content: string): string {
  // Common signature patterns
  const signaturePatterns = [
    /\n--\s*\n[\s\S]*$/,  // Standard signature delimiter
    /\nBest regards,[\s\S]*$/i,
    /\nSincerely,[\s\S]*$/i,
    /\nThanks,[\s\S]*$/i,
    /\nRegards,[\s\S]*$/i,
    /\nSent from my [\s\S]*$/i
  ]
  
  let cleanContent = content
  signaturePatterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '')
  })
  
  return cleanContent.trim()
}
