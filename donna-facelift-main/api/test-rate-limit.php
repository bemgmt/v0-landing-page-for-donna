<?php
/**
 * Test script for rate limiting
 * Tests that rate limits are properly enforced
 */

// Temporarily disable auto-enforcement for testing
$_ENV['ENABLE_PHP_RATE_LIMITING'] = 'false';

require_once __DIR__ . '/../bootstrap_env.php';
require_once __DIR__ . '/lib/env-validator.php';
require_once __DIR__ . '/lib/rate-limiter.php';
require_once __DIR__ . '/../lib/ApiResponder.php'; // WS3 - Standardized responses

ApiResponder::initTraceId();
header('Content-Type: application/json');

// Re-enable rate limiting
$_ENV['ENABLE_PHP_RATE_LIMITING'] = 'true';

// Get test parameters
$action = $_GET['action'] ?? 'test';
$endpoint = $_GET['endpoint'] ?? 'test-rate-limit';
$identifier = $_GET['identifier'] ?? null;

$limiter = RateLimiter::getInstance();

if ($action === 'test') {
    // Test rate limiting
    $allowed = $limiter->checkLimit($endpoint, $identifier);
    $status = $limiter->getStatus($endpoint, $identifier);
    
    if (!$allowed) {
        http_response_code(429);
        header('Retry-After: ' . $status['window']);
        header('X-RateLimit-Limit: ' . $status['limit']);
        header('X-RateLimit-Remaining: 0');
        header('X-RateLimit-Reset: ' . $status['reset']);
    } else {
        header('X-RateLimit-Limit: ' . $status['limit']);
        header('X-RateLimit-Remaining: ' . $status['remaining']);
        header('X-RateLimit-Reset: ' . $status['reset']);
    }
    
    if ($allowed) {
        ApiResponder::jsonSuccess($status, 'Request allowed');
    } else {
        ApiResponder::jsonError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }
} elseif ($action === 'status') {
    // Get current status without incrementing
    $status = $limiter->getStatus($endpoint, $identifier);
    ApiResponder::jsonSuccess($status, 'Rate limit status');
} elseif ($action === 'cleanup') {
    // Run cleanup
    $limiter->cleanup();
    ApiResponder::jsonSuccess(null, 'Cleanup completed');
} else {
    ApiResponder::jsonError('Invalid action', 400, 'INVALID_ACTION');
}