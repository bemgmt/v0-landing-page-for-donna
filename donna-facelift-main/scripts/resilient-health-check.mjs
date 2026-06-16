#!/usr/bin/env node

/**
 * Resilient Health Check for CI
 * Retries health checks with backoff to handle server startup delays
 */

const MAX_RETRIES = 5
const BASE_DELAY = 1000 // 1 second
const url = process.argv[2] || 'http://localhost:3000/api/health'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkHealth(attempt = 1) {
  try {
    console.log(`🏥 Health check attempt ${attempt}/${MAX_RETRIES}: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 10000 // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.status) {
      throw new Error('Health response missing status field')
    }
    
    console.log('✅ Health check PASSED')
    console.log(`   Status: ${data.status}`)
    console.log(`   Uptime: ${data.uptime}s`)
    console.log(`   Version: ${data.version}`)
    
    if (data.memory) {
      console.log(`   Memory: ${data.memory.used}MB / ${data.memory.total}MB`)
    }
    
    return true
    
  } catch (error) {
    console.log(`❌ Attempt ${attempt} failed: ${error.message}`)
    
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Health check failed after ${MAX_RETRIES} attempts: ${error.message}`)
    }
    
    // Exponential backoff with jitter
    const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 500
    console.log(`⏳ Retrying in ${Math.round(delay)}ms...`)
    await sleep(delay)
    
    return checkHealth(attempt + 1)
  }
}

async function runHealthCheck() {
  try {
    await checkHealth()
    console.log('🎉 Resilient health check completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('💥 Health check failed definitively:', error.message)
    process.exit(1)
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Health check interrupted')
  process.exit(1)
})

process.on('SIGTERM', () => {
  process.exit(1)
})

runHealthCheck()
