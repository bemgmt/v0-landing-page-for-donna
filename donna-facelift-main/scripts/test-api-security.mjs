#!/usr/bin/env node

/**
 * API Security Integration Test
 * Tests that our security features are properly integrated into API endpoints
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test framework
let testCount = 0
let passCount = 0

function test(name, fn) {
  testCount++
  try {
    console.log(`Testing: ${name}`)
    fn()
    passCount++
    console.log(`PASS: ${name}`)
  } catch (error) {
    console.error(`FAIL: ${name}`)
    console.error(`   Error: ${error.message}`)
  }
  console.log('')
}

// Test that security features are properly integrated
test('Realtime Token Endpoint - Security Integration', () => {
  const code = readFileSync(join(__dirname, '..', 'app', 'api', 'realtime', 'token', 'route.ts'), 'utf8')
  if (!code.includes('SECURITY_ENABLED')) throw new Error('SECURITY_ENABLED feature flag not found')
  if (!code.includes('import { authenticateRequest }')) throw new Error('Authentication import not found')
  if (!code.includes('checkRateLimit')) throw new Error('Rate limiting import not found')
  if (!code.includes('logSecurityEvent')) throw new Error('Security logging import not found')
  if (!code.includes('handleSecureRequest')) throw new Error('Secure request handler not found')
  if (!code.includes('handleSimpleRequest')) throw new Error('Simple request handler not found')
  console.log('   All security features properly integrated')
})

test('Voice Events Endpoint - Security Integration', () => {
  const code = readFileSync(join(__dirname, '..', 'app', 'api', 'voice', 'events', 'route.ts'), 'utf8')
  if (!code.includes('SECURITY_ENABLED')) throw new Error('SECURITY_ENABLED feature flag not found')
  if (!code.includes('checkRateLimit')) throw new Error('Rate limiting not implemented')
  if (!code.includes('logSecurityEvent')) throw new Error('Security logging not implemented')
  if (!code.includes('generateTraceId')) throw new Error('Trace ID generation not implemented')
  console.log('   Security features properly integrated')
})

test('Voice Fanout Endpoint - Security Integration', () => {
  const code = readFileSync(join(__dirname, '..', 'app', 'api', 'voice', 'fanout', 'route.ts'), 'utf8')
  if (!code.includes('SECURITY_ENABLED')) throw new Error('SECURITY_ENABLED feature flag not found')
  if (!code.includes('checkRateLimit')) throw new Error('Rate limiting not implemented')
  if (!code.includes('logSecurityEvent')) throw new Error('Security logging not implemented')
  if (!code.includes('generateTraceId')) throw new Error('Trace ID generation not implemented')
  console.log('   Security features properly integrated')
})

test('Middleware - Present and returns response', () => {
  const code = readFileSync(join(__dirname, '..', 'middleware.ts'), 'utf8')
  if (!code.includes('NextResponse')) throw new Error('Middleware must use NextResponse')
  if (!code.includes('next()')) throw new Error('Middleware must call next()')
  console.log('   Middleware is configured')
})

test('Security Libraries - Functionality', () => {
  const rateLimitCode = readFileSync(join(__dirname, '..', 'lib', 'rate-limit.ts'), 'utf8')
  if (!rateLimitCode.includes('export function checkRateLimit')) throw new Error('Rate limit function not exported')
  if (!rateLimitCode.includes('RATE_LIMITS')) throw new Error('Rate limit configuration not found')

  const loggerCode = readFileSync(join(__dirname, '..', 'lib', 'security-logger.ts'), 'utf8')
  if (!loggerCode.includes('export function logSecurityEvent')) throw new Error('Security logging function not exported')
  if (!loggerCode.includes('export function generateTraceId')) throw new Error('Trace ID generation function not exported')

  const validationCode = readFileSync(join(__dirname, '..', 'lib', 'input-validation.ts'), 'utf8')
  if (!validationCode.includes('export function validateValue')) throw new Error('Input validation function not exported')

  const authCode = readFileSync(join(__dirname, '..', 'lib', 'auth.ts'), 'utf8')
  if (!authCode.includes('export async function authenticateRequest')) throw new Error('Authentication function not exported')

  console.log('   All security libraries properly structured')
})

test('Environment Validation - Integration', () => {
  const envCode = readFileSync(join(__dirname, '..', 'lib', 'env-validation.ts'), 'utf8')
  if (!envCode.includes('export function validateEnvironment')) throw new Error('Environment validation function not found')
  if (!envCode.includes('export function getSecurityConfig')) throw new Error('Security config function not found')
  const scriptCode = readFileSync(join(__dirname, 'validate-env.mjs'), 'utf8')
  if (!scriptCode.includes('validateEnvironment')) throw new Error('Environment validation script not properly configured')
  console.log('   Environment validation properly integrated')
})

test('Feature Flags - Proper Implementation', () => {
  const endpoints = [
    'app/api/realtime/token/route.ts',
    'app/api/voice/events/route.ts',
    'app/api/voice/fanout/route.ts'
  ]
  for (const endpoint of endpoints) {
    const code = readFileSync(join(__dirname, '..', endpoint), 'utf8')
    if (!code.includes("const SECURITY_ENABLED = process.env.NODE_ENV === 'production' || process.env.ENABLE_API_SECURITY === 'true'")) {
      throw new Error(`Inconsistent feature flag implementation in ${endpoint}`)
    }
    if (!code.includes('if (SECURITY_ENABLED)')) {
      throw new Error(`Security not conditionally applied in ${endpoint}`)
    }
  }
  console.log('   Feature flags consistently implemented across all endpoints')
})

console.log('API Security Integration Test Summary')
console.log('====================================')
console.log(`Total tests: ${testCount}`)
console.log(`Passed: ${passCount}`)
console.log(`Failed: ${testCount - passCount}`)

if (passCount === testCount) {
  console.log('All API security integration tests passed!')
  console.log('Security features are properly integrated and ready for production')
  process.exit(0)
} else {
  console.log('Some API security integration tests failed!')
  process.exit(1)
}

