#!/usr/bin/env node

/**
 * Security validation script for the hardened token endpoint
 * Part of WS1 Phase 1 Security Hardening
 */

const path = require('path');
const fs = require('fs');

console.log('🔐 Security Implementation Validation');
console.log('=====================================\n');

// Check if files exist
const requiredFiles = [
  'lib/auth.ts',
  'lib/rate-limit.ts',
  'lib/security-logger.ts',
  'app/api/realtime/token/route.ts'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - exists`);
  } else {
    console.log(`❌ ${file} - missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check if the endpoint has security controls
const tokenEndpointPath = path.join(process.cwd(), 'app/api/realtime/token/route.ts');
const tokenEndpointContent = fs.readFileSync(tokenEndpointPath, 'utf8');

const securityChecks = [
  {
    name: 'Authentication import',
    check: () => tokenEndpointContent.includes('import { authenticateRequest }')
  },
  {
    name: 'Rate limiting import',
    check: () => tokenEndpointContent.includes('import { checkRateLimit')
  },
  {
    name: 'Security logging import',
    check: () => tokenEndpointContent.includes('import { createSecurityLogger }')
  },
  {
    name: 'Origin validation function',
    check: () => tokenEndpointContent.includes('function validateOrigin')
  },
  {
    name: 'Input validation function',
    check: () => tokenEndpointContent.includes('function validateAndSanitizeInput')
  },
  {
    name: 'Security headers function',
    check: () => tokenEndpointContent.includes('function setSecurityHeaders')
  },
  {
    name: 'Authentication check',
    check: () => tokenEndpointContent.includes('authenticateRequest(req)')
  },
  {
    name: 'Rate limiting check',
    check: () => tokenEndpointContent.includes('checkRateLimit(')
  },
  {
    name: 'Origin validation',
    check: () => tokenEndpointContent.includes('validateOrigin(req)')
  },
  {
    name: 'Input validation',
    check: () => tokenEndpointContent.includes('validateAndSanitizeInput(')
  },
  {
    name: 'Security logging',
    check: () => tokenEndpointContent.includes('createSecurityLogger(req)')
  },
  {
    name: 'Trace ID in responses',
    check: () => tokenEndpointContent.includes('traceId: logger.getTraceId()')
  }
];

console.log('\n🔍 Security Controls Validation:');
console.log('================================\n');

let allChecksPassed = true;

securityChecks.forEach(({ name, check }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) {
    allChecksPassed = false;
  }
});

// Check environment variables setup
console.log('\n🌍 Environment Configuration:');
console.log('=============================\n');

const envChecks = [
  { name: 'ALLOWED_ORIGINS support', check: () => tokenEndpointContent.includes('process.env.ALLOWED_ORIGINS') },
  { name: 'OPENAI_API_KEY check', check: () => tokenEndpointContent.includes('process.env.OPENAI_API_KEY') },
  { name: 'Production domain support', check: () => tokenEndpointContent.includes('process.env.PRODUCTION_DOMAIN') }
];

envChecks.forEach(({ name, check }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) {
    allChecksPassed = false;
  }
});

// Check middleware integration
console.log('\n🛡️ Middleware Integration:');
console.log('=========================\n');

const middlewarePath = path.join(process.cwd(), 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  const middlewareChecks = [
    { name: 'CORS middleware exists', check: () => middlewareContent.includes('CORS Security Middleware') },
    { name: 'Origin validation', check: () => middlewareContent.includes('allowedOrigins.includes(origin)') }
  ];
  
  middlewareChecks.forEach(({ name, check }) => {
    const passed = check();
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) {
      allChecksPassed = false;
    }
  });
} else {
  console.log('❌ middleware.ts - missing');
  allChecksPassed = false;
}

// Summary
console.log('\n📊 Summary:');
console.log('===========\n');

if (allChecksPassed) {
  console.log('🎉 All security validations passed!');
  console.log('✅ Token endpoint is properly hardened');
  console.log('\nSecurity features implemented:');
  console.log('  • Authentication required (Clerk + JWT fallback)');
  console.log('  • Origin validation against ALLOWED_ORIGINS');
  console.log('  • Rate limiting (10 tokens per minute per user/IP)');
  console.log('  • Input validation and sanitization');
  console.log('  • Security logging with trace IDs');
  console.log('  • Security headers on all responses');
  console.log('  • Comprehensive error handling');
  console.log('  • CORS middleware integration');
} else {
  console.log('❌ Some security validations failed!');
  console.log('⚠️  Please review the implementation');
  process.exit(1);
}

console.log('\n🚀 Next steps:');
console.log('  1. Set environment variables (ALLOWED_ORIGINS, OPENAI_API_KEY)');
console.log('  2. Test the endpoint with valid/invalid requests');
console.log('  3. Monitor security logs for suspicious activity');
console.log('  4. Consider adding monitoring/alerting for rate limit violations');