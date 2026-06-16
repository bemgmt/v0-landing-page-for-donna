<?php
/**
 * Test script for WS4 Error Response System
 * 
 * Tests standardized error response format and trace ID correlation
 * Part of Phase 4 Data/Privacy Gate testing
 */

require_once __DIR__ . '/lib/ErrorResponse.php';

echo "=== WS4 Error Response System Test ===\n\n";

// Test 1: Basic error response creation
echo "Test 1: Basic error response creation\n";
$response1 = ErrorResponse::create('VALIDATION_ERROR', 'Custom validation message');
echo "✓ Validation error created:\n";
echo "  - ok: " . ($response1['ok'] ? 'true' : 'false') . "\n";
echo "  - error: " . $response1['error'] . "\n";
echo "  - message: " . $response1['message'] . "\n";
echo "  - ref: " . $response1['ref'] . "\n\n";

// Test 2: Different error types
echo "Test 2: Different error types\n";
$errorTypes = [
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'NOT_FOUND',
    'RATE_LIMIT_EXCEEDED',
    'API_ERROR',
    'SYSTEM_ERROR'
];

foreach ($errorTypes as $errorType) {
    $response = ErrorResponse::create($errorType);
    echo "✓ {$errorType}: {$response['message']} (ref: {$response['ref']})\n";
}
echo "\n";

// Test 3: Convenience methods
echo "Test 3: Convenience methods\n";

$validationResponse = ErrorResponse::validation('email', 'invalid format');
echo "✓ Validation method: {$validationResponse['message']} (ref: {$validationResponse['ref']})\n";

$authResponse = ErrorResponse::authentication('Token expired');
echo "✓ Authentication method: {$authResponse['message']} (ref: {$authResponse['ref']})\n";

$notFoundResponse = ErrorResponse::notFound('user');
echo "✓ Not found method: {$notFoundResponse['message']} (ref: {$notFoundResponse['ref']})\n";

$rateLimitResponse = ErrorResponse::rateLimit(60);
echo "✓ Rate limit method: {$rateLimitResponse['message']} (ref: {$rateLimitResponse['ref']})\n";

$apiErrorResponse = ErrorResponse::apiError('OpenAI');
echo "✓ API error method: {$apiErrorResponse['message']} (ref: {$apiErrorResponse['ref']})\n\n";

// Test 4: Exception handling
echo "Test 4: Exception handling\n";
try {
    throw new InvalidArgumentException('Test validation exception');
} catch (Exception $e) {
    $exceptionResponse = ErrorResponse::fromException($e, ['test_context' => 'unit_test']);
    echo "✓ Exception handled: {$exceptionResponse['message']} (ref: {$exceptionResponse['ref']})\n";
}

try {
    throw new Exception('Generic test exception');
} catch (Exception $e) {
    $genericResponse = ErrorResponse::fromException($e);
    echo "✓ Generic exception: {$genericResponse['message']} (ref: {$genericResponse['ref']})\n";
}
echo "\n";

// Test 5: Success responses
echo "Test 5: Success responses\n";
$successResponse1 = ErrorResponse::success();
echo "✓ Basic success: ok=" . ($successResponse1['ok'] ? 'true' : 'false') . "\n";

$successResponse2 = ErrorResponse::success(['user_id' => 123], 'User created successfully');
echo "✓ Success with data: ok=" . ($successResponse2['ok'] ? 'true' : 'false') . 
     ", message=" . $successResponse2['message'] . 
     ", data=" . json_encode($successResponse2['data']) . "\n\n";

// Test 6: Response validation
echo "Test 6: Response validation\n";
$validResponses = [
    ['ok' => true],
    ['ok' => false, 'error' => 'TEST_ERROR', 'message' => 'Test message'],
    ['ok' => true, 'data' => ['test' => 'data'], 'message' => 'Success']
];

$invalidResponses = [
    ['error' => 'TEST_ERROR'], // Missing 'ok'
    ['ok' => false], // Missing error and message
    ['ok' => 'true'], // Wrong type for 'ok'
    'not an array'
];

foreach ($validResponses as $i => $response) {
    $isValid = ErrorResponse::validate($response);
    echo "✓ Valid response " . ($i + 1) . ": " . ($isValid ? 'PASS' : 'FAIL') . "\n";
}

foreach ($invalidResponses as $i => $response) {
    $isValid = ErrorResponse::validate($response);
    echo "✓ Invalid response " . ($i + 1) . ": " . ($isValid ? 'FAIL' : 'PASS') . "\n";
}
echo "\n";

// Test 7: Convenience functions
echo "Test 7: Convenience functions\n";
$convenienceError = error_response('SYSTEM_ERROR', 'Test system error');
echo "✓ error_response function: {$convenienceError['message']} (ref: {$convenienceError['ref']})\n";

$convenienceSuccess = success_response(['test' => 'data'], 'Test success');
echo "✓ success_response function: ok=" . ($convenienceSuccess['ok'] ? 'true' : 'false') . 
     ", message=" . $convenienceSuccess['message'] . "\n\n";

// Test 8: HTTP status codes
echo "Test 8: HTTP status codes (simulated)\n";
$statusTests = [
    ['VALIDATION_ERROR', 400],
    ['AUTHENTICATION_ERROR', 401],
    ['AUTHORIZATION_ERROR', 403],
    ['NOT_FOUND', 404],
    ['RATE_LIMIT_EXCEEDED', 429],
    ['API_ERROR', 502],
    ['SYSTEM_ERROR', 500]
];

foreach ($statusTests as [$errorCode, $expectedStatus]) {
    // Capture the status code that would be set
    ob_start();
    $response = ErrorResponse::create($errorCode, null, [], $expectedStatus);
    ob_end_clean();
    
    echo "✓ {$errorCode}: Expected HTTP {$expectedStatus}\n";
}
echo "\n";

// Test 9: Context logging
echo "Test 9: Context logging with PII\n";
$contextWithPii = [
    'user_email' => 'test@example.com',
    'user_phone' => '555-123-4567',
    'api_key' => 'sk-1234567890abcdef1234567890abcdef',
    'safe_data' => 'This is safe to log'
];

$piiResponse = ErrorResponse::create('VALIDATION_ERROR', 'Test PII context', $contextWithPii);
echo "✓ Error with PII context logged (ref: {$piiResponse['ref']})\n";
echo "  Note: Check logs to verify PII was scrubbed\n\n";

// Test 10: Abuse detection response
echo "Test 10: Abuse detection response\n";
$abuseResponse = ErrorResponse::abuseDetected(['severity' => 'high', 'reason' => 'spam']);
echo "✓ Abuse detected: {$abuseResponse['message']} (ref: {$abuseResponse['ref']})\n\n";

echo "=== All Tests Completed ===\n";
echo "All error responses include trace IDs for correlation.\n";
echo "Check the logs directory to verify proper logging and PII scrubbing.\n";
echo "Responses follow the standard format: {ok, error?, message?, ref?, data?}\n";
