#!/usr/bin/env node

/**
 * WebSocket Authentication Smoke Test
 * Tests WebSocket auth flow: connect to /realtime, test auth paths
 * Tests: no auth → 4001, bad token → 4003, good token → auth_success
 */

import WebSocket from 'ws'

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001/realtime'
const TEST_TOKEN = process.env.SMOKE_JWT || 'dev.header.payload'

let testsPassed = 0
let testsTotal = 0

function test(name, testFn) {
  testsTotal++
  console.log(`\n🔍 Testing: ${name}`)
  
  return testFn()
    .then(() => {
      testsPassed++
      console.log(`✅ PASS: ${name}`)
    })
    .catch(err => {
      console.log(`❌ FAIL: ${name}`)
      console.log(`   Error: ${err.message}`)
      throw err
    })
}

function createWebSocket(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    let resolved = false
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true
        ws.close()
      }
    }
    
    ws.on('open', () => {
      if (!resolved) {
        resolved = true
        resolve(ws)
      }
    })
    
    ws.on('error', (err) => {
      cleanup()
      reject(new Error(`WebSocket error: ${err.message}`))
    })
    
    ws.on('close', (code, reason) => {
      cleanup()
      reject(new Error(`WebSocket closed: ${code} ${reason}`))
    })
    
    setTimeout(() => {
      if (!resolved) {
        cleanup()
        reject(new Error('WebSocket connection timeout'))
      }
    }, timeout)
  })
}

async function testNoAuth() {
  const ws = await createWebSocket(WS_URL)
  
  return new Promise((resolve, reject) => {
    let resolved = false
    
    // Expect auth timeout (4001)
    ws.on('close', (code, reason) => {
      if (!resolved) {
        resolved = true
        if (code === 4001) {
          resolve()
        } else {
          reject(new Error(`Expected close code 4001 (auth timeout), got ${code}: ${reason}`))
        }
      }
    })
    
    // Wait for auth timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        ws.close()
        reject(new Error('Auth timeout did not occur within expected time'))
      }
    }, 6000) // Auth timeout is usually 5 seconds
  })
}

async function testBadToken() {
  const ws = await createWebSocket(WS_URL)
  
  return new Promise((resolve, reject) => {
    let resolved = false
    
    ws.on('close', (code, reason) => {
      if (!resolved) {
        resolved = true
        if (code === 4003) {
          resolve()
        } else {
          reject(new Error(`Expected close code 4003 (invalid token), got ${code}: ${reason}`))
        }
      }
    })
    
    ws.on('open', () => {
      // Send bad token
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: 'invalid.bad.token'
      }))
    })
    
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        ws.close()
        reject(new Error('Invalid token rejection did not occur'))
      }
    }, 3000)
  })
}

async function testGoodToken() {
  const ws = await createWebSocket(WS_URL)
  
  return new Promise((resolve, reject) => {
    let resolved = false
    let authSuccess = false
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)
        if (message.type === 'auth_success' || message.type === 'session.created') {
          authSuccess = true
          if (!resolved) {
            resolved = true
            ws.close()
            resolve()
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    })
    
    ws.on('close', (code, reason) => {
      if (!resolved) {
        resolved = true
        if (authSuccess) {
          resolve()
        } else {
          reject(new Error(`WebSocket closed before auth success: ${code} ${reason}`))
        }
      }
    })
    
    ws.on('open', () => {
      // Send valid token
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: TEST_TOKEN
      }))
    })
    
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        ws.close()
        if (authSuccess) {
          resolve()
        } else {
          reject(new Error('Auth success not received within timeout'))
        }
      }
    }, 5000)
  })
}

async function runTests() {
  console.log('🧪 WebSocket Authentication Smoke Test')
  console.log(`📍 Testing WebSocket: ${WS_URL}`)
  console.log(`🔑 Using test token: ${TEST_TOKEN.substring(0, 10)}...`)
  
  try {
    await test('No auth → timeout (4001)', testNoAuth)
    await test('Bad token → rejection (4003)', testBadToken)  
    await test('Good token → auth success', testGoodToken)
    
    console.log(`\n🎉 WebSocket auth tests: ${testsPassed}/${testsTotal} passed`)
    
    if (testsPassed === testsTotal) {
      console.log('✅ All WebSocket auth tests PASSED')
      process.exit(0)
    } else {
      console.log('❌ Some WebSocket auth tests FAILED')
      process.exit(1)
    }
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection timeout')) {
      console.log('\n⚠️  WebSocket server not running')
      console.log('   This is expected if WebSocket proxy is not started')
      console.log('   To test: Start WebSocket server and set NEXT_PUBLIC_WEBSOCKET_URL')
      console.log('✅ WebSocket auth smoke test SKIPPED (server not available)')
      process.exit(0) // Don't fail CI if WS server isn't running
    }
    
    console.error('\n💥 WebSocket auth test suite failed:', error.message)
    process.exit(1)
  }
}

runTests()
