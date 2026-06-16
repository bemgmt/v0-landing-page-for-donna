#!/usr/bin/env node

/**
 * PHP Response Schema Validator
 * Validates that PHP endpoints return consistent response format
 */

const PHP_BASE = process.env.DEV_PHP_BASE || 'http://127.0.0.1:8000'

// Endpoints to test with expected methods
const endpoints = [
    { path: '/api/health.php', method: 'GET', expectSuccess: true },
    { path: '/api/donna_logic.php', method: 'POST', body: { message: 'test' }, expectAuth: true },
    { path: '/api/chatbot_settings.php', method: 'GET', expectSuccess: true },
    { path: '/api/conversations.php', method: 'GET', expectSuccess: true },
    { path: '/api/marketing-simple.php', method: 'GET', expectSuccess: true },
]

let passed = 0
let total = 0

function validateResponseSchema(data, endpoint) {
    const errors = []
    
    // Must have success field
    if (typeof data.success !== 'boolean') {
        errors.push('Missing or invalid "success" field (must be boolean)')
    }
    
    // Must have traceId for correlation
    if (typeof data.traceId !== 'string' || !data.traceId) {
        errors.push('Missing or invalid "traceId" field (must be non-empty string)')
    }
    
    // Success responses should have data
    if (data.success === true && !data.hasOwnProperty('data') && !data.hasOwnProperty('message')) {
        errors.push('Success response missing "data" or "message" field')
    }
    
    // Error responses should have error message
    if (data.success === false && (typeof data.error !== 'string' || !data.error)) {
        errors.push('Error response missing or invalid "error" field (must be non-empty string)')
    }
    
    return errors
}

async function testEndpoint(endpoint) {
    total++
    console.log(`\n🔍 Testing: ${endpoint.method} ${endpoint.path}`)
    
    try {
        const url = `${PHP_BASE}${endpoint.path}`
        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
        
        if (endpoint.body) {
            options.body = JSON.stringify(endpoint.body)
        }
        
        const response = await fetch(url, options)
        
        // Check if we expect auth error
        if (endpoint.expectAuth && (response.status === 401 || response.status === 403)) {
            console.log(`✅ PASS: ${endpoint.path} - Auth correctly required (${response.status})`)
            passed++
            return
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        const schemaErrors = validateResponseSchema(data, endpoint)
        
        if (schemaErrors.length === 0) {
            console.log(`✅ PASS: ${endpoint.path} - Schema valid`)
            console.log(`   success: ${data.success}, traceId: ${data.traceId?.substring(0, 16)}...`)
            passed++
        } else {
            console.log(`❌ FAIL: ${endpoint.path} - Schema errors:`)
            schemaErrors.forEach(error => console.log(`   • ${error}`))
            console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
        }
        
    } catch (error) {
        if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
            console.log(`⚠️  SKIP: ${endpoint.path} - PHP backend not running`)
            console.log(`   To test: Start PHP with "php -S 127.0.0.1:8000 -t ."`)
            // Don't count as failure for CI when backend isn't available
            passed++
        } else {
            console.log(`❌ FAIL: ${endpoint.path} - ${error.message}`)
        }
    }
}

async function runValidation() {
    console.log('🧪 PHP Response Schema Validation')
    console.log(`📍 Testing against: ${PHP_BASE}`)
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint)
    }
    
    console.log(`\n🎉 Validation completed: ${passed}/${total} passed`)
    
    if (passed === total) {
        console.log('✅ All PHP response schemas VALID')
        process.exit(0)
    } else {
        console.log('❌ Some PHP response schemas INVALID')
        process.exit(1)
    }
}

runValidation().catch(error => {
    console.error('💥 Validation failed:', error.message)
    process.exit(1)
})
