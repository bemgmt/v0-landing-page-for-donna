#!/usr/bin/env node

/**
 * Health check script for monitoring
 * Usage: node scripts/health-check.mjs [url]
 */

const url = process.argv[2] || 'http://localhost:3000/api/health'

async function checkHealth() {
  try {
    console.log(`🏥 Checking health at: ${url}`)

    // Measure response time
    const startTime = Date.now()

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Check cache headers
    const cacheStatus = response.headers.get('X-Cache') || 'MISS'
    const cacheTTL = response.headers.get('X-Cache-TTL') || 'N/A'
    
    // Performance thresholds
    const responseTimeStatus = responseTime < 500 ? '✅' : responseTime < 2000 ? '⚠️' : '❌'
    const performanceStatus = responseTime < 2000 ? 'PASSED' : 'FAILED'

    console.log(`${responseTimeStatus} Health check ${performanceStatus}`)
    console.log(`   Status: ${data.status}`)
    console.log(`   Response Time: ${responseTime}ms ${responseTimeStatus}`)
    console.log(`   Cache Status: ${cacheStatus} (TTL: ${cacheTTL}s)`)
    console.log(`   Uptime: ${data.uptime}s`)
    console.log(`   Version: ${data.version}`)
    console.log(`   Environment: ${data.environment}`)

    if (data.memory) {
      console.log(`   Memory: ${data.memory.used}MB / ${data.memory.total}MB`)
    }
    
    if (data.services) {
      console.log('   Services:')
      Object.entries(data.services).forEach(([service, status]) => {
        const icon = status === 'configured' ? '✅' : '⚠️'
        console.log(`     ${icon} ${service}: ${status}`)
      })
    }

    // Performance warnings
    if (responseTime > 500) {
      console.log(`⚠️  Warning: Response time (${responseTime}ms) exceeds 500ms threshold`)
    }

    if (responseTime > 2000) {
      console.log(`❌ Error: Response time (${responseTime}ms) exceeds 2000ms threshold`)
      process.exit(1)
    }

    process.exit(0)
    
  } catch (error) {
    console.error('❌ Health check FAILED')
    console.error(`   Error: ${error.message}`)
    process.exit(1)
  }
}

checkHealth()
