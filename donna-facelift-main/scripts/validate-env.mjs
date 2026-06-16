#!/usr/bin/env node

/**
 * Environment validation script
 * Run this before starting the application to validate environment configuration
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local if it exists
try {
  const envPath = join(__dirname, '..', '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    }
  })
} catch {}

const REQUIRED_PRODUCTION_VARS = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

const isFaceliftPreview =
  process.env.FACELIFT_PREVIEW === 'true' ||
  (process.env.VERCEL === '1' &&
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY)

const RECOMMENDED_VARS = [
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'ALLOWED_ORIGINS',
  'PRODUCTION_DOMAIN'
]

const SECURITY_VARS = [
  'JWT_SECRET',
  'ENABLE_API_SECURITY'
]

function validateEnvVar(name, value, required = false) {
  if (!value) return required
    ? { valid: false, error: `${name} is required but not set` }
    : { valid: true, warning: `${name} is not set (optional)` }

  switch (name) {
    case 'OPENAI_API_KEY':
      if (!value.startsWith('sk-')) return { valid: false, error: `${name} should start with 'sk-'` }
      if (value.length < 20) return { valid: false, error: `${name} appears to be too short` }
      break
    case 'NEXT_PUBLIC_SUPABASE_URL':
    case 'SENTRY_DSN':
    case 'NEXT_PUBLIC_SENTRY_DSN':
      try { new URL(value) } catch { return { valid: false, error: `${name} must be a valid URL` } }
      break
    case 'SUPABASE_SERVICE_ROLE_KEY':
    case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
      if (value.length < 100) return { valid: false, error: `${name} appears to be too short for a Supabase key` }
      break
    case 'ALLOWED_ORIGINS':
      const origins = value.split(',').map(o => o.trim())
      for (const origin of origins) {
        if (origin !== 'localhost' && origin !== '*') {
          try { new URL(origin) } catch { return { valid: false, error: `Invalid origin in ${name}: ${origin}` } }
        }
      }
      break
    case 'ENABLE_API_SECURITY':
      if (!['true', 'false'].includes(value.toLowerCase())) return { valid: false, error: `${name} must be 'true' or 'false'` }
      break
  }
  return { valid: true }
}

function validateEnvironment() {
  const errors = []
  const warnings = []
  const config = {}

  const isProduction = process.env.NODE_ENV === 'production'
  const enforcingProductionRequirements = isProduction && !isFaceliftPreview
  console.log(`Validating environment (NODE_ENV: ${process.env.NODE_ENV || 'development'})`)
  if (isFaceliftPreview) {
    console.warn('Facelift preview mode detected — skipping required Supabase/OpenAI env checks. Backend integrations are disabled in this mode.')
  }

  const requiredVars = enforcingProductionRequirements ? REQUIRED_PRODUCTION_VARS : []
  for (const varName of requiredVars) {
    const result = validateEnvVar(varName, process.env[varName], true)
    if (!result.valid && result.error) errors.push(result.error)
    else if (result.warning) warnings.push(result.warning)
    config[varName] = process.env[varName] || null
  }

  for (const varName of RECOMMENDED_VARS) {
    const result = validateEnvVar(varName, process.env[varName], false)
    if (!result.valid && result.error) errors.push(result.error)
    else if (result.warning) warnings.push(result.warning)
    config[varName] = process.env[varName] || null
  }

  for (const varName of SECURITY_VARS) {
    const result = validateEnvVar(varName, process.env[varName], false)
    if (!result.valid && result.error) errors.push(result.error)
    else if (result.warning) warnings.push(result.warning)
    config[varName] = process.env[varName] || null
  }

  if (enforcingProductionRequirements) {
    const hasJWT = process.env.JWT_SECRET
    if (!hasJWT) warnings.push('No JWT_SECRET configured; using demo auth')

    const securityEnabled = process.env.ENABLE_API_SECURITY?.toLowerCase() === 'true'
    if (!securityEnabled) warnings.push('API security is not explicitly enabled in production')

    if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) warnings.push('No Sentry monitoring configured for production')
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
  }
  if (warnings.length > 0) {
    console.warn('Environment warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Environment validation passed')
  }

  const securityConfig = {
    securityEnabled: enforcingProductionRequirements || process.env.ENABLE_API_SECURITY === 'true',
    demoAuthEnabled: true,
    jwtEnabled: !!process.env.JWT_SECRET,
    sentryEnabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    allowedOrigins: (process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://donna-interactive.vercel.app'
    ]).length
  }
  console.log('Security configuration:', securityConfig)

  return { valid: errors.length === 0, errors, warnings, config }
}

const result = validateEnvironment()
if (!result.valid) {
  console.error('\nEnvironment validation failed. Please fix the errors above.')
  process.exit(1)
} else {
  console.log('\nEnvironment validation completed successfully!')
  process.exit(0)
}

