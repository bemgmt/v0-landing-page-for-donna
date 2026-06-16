#!/usr/bin/env node
/**
 * Test script for Vertical System
 * Tests vertical selection, storage, and access control
 * Part of Phase 5 Expansion - Vertical-Specific Modules
 */

import https from 'https';
import http from 'http';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_JWT = process.env.TEST_JWT || 'test-jwt-token';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_JWT}`,
        ...options.headers
      }
    };
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runTests() {
  log('\n=== Vertical System Test Suite ===\n', 'blue');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Get available verticals
  try {
    log('Test 1: Get available verticals list', 'yellow');
    const response = await makeRequest('/api/user/vertical.php?action=list');
    
    if (response.status === 200 && response.data.success && response.data.verticals) {
      log('✓ Successfully retrieved verticals list', 'green');
      log(`  Found ${response.data.verticals.length} verticals`, 'blue');
      passed++;
    } else {
      log('✗ Failed to retrieve verticals list', 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 2: Set user vertical (valid)
  try {
    log('\nTest 2: Set user vertical to "hospitality"', 'yellow');
    const response = await makeRequest('/api/user/vertical.php', {
      method: 'POST',
      body: { vertical: 'hospitality' }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✓ Successfully set vertical to hospitality', 'green');
      passed++;
    } else {
      log('✗ Failed to set vertical', 'red');
      log(`  Status: ${response.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 3: Get current user vertical
  try {
    log('\nTest 3: Get current user vertical', 'yellow');
    const response = await makeRequest('/api/user/vertical.php?action=current');
    
    if (response.status === 200 && response.data.success && response.data.vertical === 'hospitality') {
      log('✓ Successfully retrieved current vertical', 'green');
      log(`  Vertical: ${response.data.vertical_name}`, 'blue');
      passed++;
    } else {
      log('✗ Failed to retrieve current vertical', 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 4: Set invalid vertical
  try {
    log('\nTest 4: Attempt to set invalid vertical', 'yellow');
    const response = await makeRequest('/api/user/vertical.php', {
      method: 'POST',
      body: { vertical: 'invalid_vertical' }
    });
    
    if (response.status === 400) {
      log('✓ Correctly rejected invalid vertical', 'green');
      passed++;
    } else {
      log('✗ Should have rejected invalid vertical', 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 5: Access hospitality dashboard (should succeed)
  try {
    log('\nTest 5: Access hospitality dashboard (authorized)', 'yellow');
    const response = await makeRequest('/api/verticals/hospitality/dashboard.php');
    
    if (response.status === 200 && response.data.success) {
      log('✓ Successfully accessed hospitality dashboard', 'green');
      passed++;
    } else {
      log('✗ Failed to access hospitality dashboard', 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    failed++;
  }
  
  // Test 6: Access real estate dashboard (should fail - wrong vertical)
  try {
    log('\nTest 6: Access real estate dashboard (unauthorized)', 'yellow');
    const response = await makeRequest('/api/verticals/real_estate/dashboard.php');
    
    if (response.status === 403) {
      log('✓ Correctly denied access to real estate dashboard', 'green');
      passed++;
    } else {
      log('✗ Should have denied access to real estate dashboard', 'red');
      log(`  Status: ${response.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    failed++;
  }
  
  // Summary
  log('\n=== Test Summary ===', 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Total: ${passed + failed}\n`, 'blue');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});

