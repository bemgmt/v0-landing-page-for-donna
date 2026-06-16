/**
 * Input validation utilities for API security
 * Part of WS1 Phase 1 Security Hardening
 */

export type ValidatableValue = string | number | boolean | Record<string, unknown> | unknown[]

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'object' | 'array'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[]
  custom?: (value: ValidatableValue | null | undefined) => boolean | string
}

export interface ValidationResult<T = ValidatableValue | null | undefined> {
  valid: boolean
  errors: string[]
  sanitized?: T
}

/**
 * Validate a single value against rules
 */
export function validateValue(
  value: ValidatableValue | null | undefined,
  rules: ValidationRule,
  fieldName: string = 'field'
): ValidationResult<ValidatableValue | null | undefined> {
  const errors: string[] = []

  // Check required
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`)
    return { valid: false, errors }
  }

  // If not required and empty, skip other validations
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return { valid: true, errors: [], sanitized: value }
  }

  // Type validation
  if (rules.type) {
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`)
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldName} must be a number`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`)
        }
        break
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${fieldName} must be a valid email`)
        }
        break
      case 'url':
        try {
          new URL(String(value))
        } catch {
          errors.push(`${fieldName} must be a valid URL`)
        }
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`${fieldName} must be an object`)
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`)
        }
        break
    }
  }

  // String-specific validations
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be at most ${rules.maxLength} characters`)
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`)
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`)
    }
  }

  // Number-specific validations
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`)
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${fieldName} must be at most ${rules.max}`)
    }
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(value)
    if (customResult !== true) {
      errors.push(typeof customResult === 'string' ? customResult : `${fieldName} is invalid`)
    }
  }

  // Basic sanitization for strings
  let sanitized: ValidatableValue | null | undefined = value
  if (typeof value === 'string') {
    // Remove null bytes and control characters
    sanitized = value.replace(/[\x00-\x1F\x7F]/g, '')
    // Trim whitespace
    sanitized = sanitized.trim()
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate an object against a schema
 */
export function validateObject(
  obj: Record<string, ValidatableValue | null | undefined>,
  schema: Record<string, ValidationRule>
): ValidationResult<Record<string, ValidatableValue | null | undefined>> {
  const errors: string[] = []
  const sanitized: Record<string, ValidatableValue | null | undefined> = {}

  // Validate each field in schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    const result = validateValue(obj[fieldName], rules, fieldName)
    if (!result.valid) {
      errors.push(...result.errors)
    } else {
      sanitized[fieldName] = result.sanitized
    }
  }

  // Check for unexpected fields (optional strict mode)
  const allowedFields = Object.keys(schema)
  const providedFields = Object.keys(obj)
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field))
  
  if (unexpectedFields.length > 0) {
    // For now, just include them in sanitized output
    // In strict mode, you might want to add errors
    for (const field of unexpectedFields) {
      sanitized[field] = obj[field]
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Common validation schemas
 */
export const COMMON_SCHEMAS = {
  EMAIL_REQUEST: {
    to: { required: true, type: 'string' as const, maxLength: 255 },
    subject: { required: true, type: 'string' as const, maxLength: 500 },
    body: { required: true, type: 'string' as const, maxLength: 10000 }
  },
  TOKEN_REQUEST: {
    instructions: { type: 'string' as const, maxLength: 1000 },
    voice: { type: 'string' as const, enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as string[] },
    model: { type: 'string' as const, maxLength: 100 }
  },
  USER_INPUT: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    message: { required: true, type: 'string' as const, minLength: 1, maxLength: 5000 }
  }
}

/**
 * Sanitize HTML content (basic)
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody(
  body: unknown,
  schema: Record<string, ValidationRule>
): ValidationResult<Record<string, ValidatableValue | null | undefined>> {
  if (!body || typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      valid: false,
      errors: ['Request body must be a valid JSON object']
    }
  }

  return validateObject(body as Record<string, ValidatableValue | null | undefined>, schema)
}
