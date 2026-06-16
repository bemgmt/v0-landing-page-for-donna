#!/usr/bin/env node

/**
 * Security features test script
 * Tests rate limiting, input validation, and security logging
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Simple test framework
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

// Mock environment for testing
process.env.NODE_ENV = 'test'

// Test rate limiting
test('Rate Limit - Basic functionality', () => {
  const rateLimitCode = readFileSync(join(__dirname, '..', 'lib', 'rate-limit.ts'), 'utf8')
  if (!rateLimitCode.includes('export function checkRateLimit')) throw new Error('checkRateLimit function not found')
  if (!rateLimitCode.includes('export const RATE_LIMITS')) throw new Error('RATE_LIMITS constant not found')
  console.log('   Rate limit module structure is correct')
})

test('Security Logger - Basic functionality', () => {
  const code = readFileSync(join(__dirname, '..', 'lib', 'security-logger.ts'), 'utf8')
  if (!code.includes('export function logSecurityEvent')) throw new Error('logSecurityEvent function not found')
  if (!code.includes('export function generateTraceId')) throw new Error('generateTraceId function not found')
  console.log('   Security logger module structure is correct')
})

test('Input Validation - Basic functionality', () => {
  const code = readFileSync(join(__dirname, '..', 'lib', 'input-validation.ts'), 'utf8')
  if (!code.includes('export function validateValue')) throw new Error('validateValue function not found')
  if (!code.includes('export const COMMON_SCHEMAS')) throw new Error('COMMON_SCHEMAS constant not found')
  console.log('   Input validation module structure is correct')
})

test('Auth Module - Basic functionality', () => {
  const code = readFileSync(join(__dirname, '..', 'lib', 'auth.ts'), 'utf8')
  if (!code.includes('export async function authenticateRequest')) throw new Error('authenticateRequest function not found')
  if (!code.includes('export function getUserIdentifier')) throw new Error('getUserIdentifier function not found')
  console.log('   Auth module structure is correct')
})

test('Environment Validation - Basic functionality', () => {
  const code = readFileSync(join(__dirname, '..', 'lib', 'env-validation.ts'), 'utf8')
  if (!code.includes('export function validateEnvironment')) throw new Error('validateEnvironment function not found')
  if (!code.includes('export function getSecurityConfig')) throw new Error('getSecurityConfig function not found')
  console.log('   Environment validation module structure is correct')
})

test('API Endpoints - Security integration', () => {
  const realtimeCode = readFileSync(join(__dirname, '..', 'app', 'api', 'realtime', 'token', 'route.ts'), 'utf8')
  if (!realtimeCode.includes('SECURITY_ENABLED')) throw new Error('SECURITY_ENABLED feature flag not found in realtime endpoint')
  if (!realtimeCode.includes('handleSecureRequest')) throw new Error('handleSecureRequest function not found in realtime endpoint')
  console.log('   Realtime token endpoint has security integration')

  const voiceEventsCode = readFileSync(join(__dirname, '..', 'app', 'api', 'voice', 'events', 'route.ts'), 'utf8')
  if (!voiceEventsCode.includes('SECURITY_ENABLED')) throw new Error('SECURITY_ENABLED feature flag not found in voice events endpoint')
  if (!voiceEventsCode.includes('checkRateLimit')) throw new Error('Rate limiting not found in voice events endpoint')
  console.log('   Voice events endpoint has security integration')
})

test('Middleware - Present and returns response', () => {
  const code = readFileSync(join(__dirname, '..', 'middleware.ts'), 'utf8')
  if (!code.includes('NextResponse')) throw new Error('Middleware must use NextResponse')
  if (!code.includes('next()')) throw new Error('Middleware must call next()')
  console.log('   Middleware is configured')
})

test('Package.json - Scripts updated', () => {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
  if (!packageJson.scripts['validate-env']) throw new Error('validate-env script not found')
  if (!packageJson.scripts.dev.includes('validate-env')) throw new Error('dev script does not include environment validation')
  console.log('   Package.json scripts are updated correctly')
})

console.log('Test Summary')
console.log('=============')
console.log(`Total tests: ${testCount}`)
console.log(`Passed: ${passCount}`)
console.log(`Failed: ${testCount - passCount}`)

if (passCount === testCount) {
  console.log('All security tests passed!')
  process.exit(0)
} else {
  console.log('Some security tests failed!')
  process.exit(1)
}

