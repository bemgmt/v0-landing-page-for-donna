<?php
/**
 * Test script for WS4 Logging System
 * 
 * Tests PII scrubbing, trace ID generation, and log rotation
 * Part of Phase 4 Data/Privacy Gate testing
 */

require_once __DIR__ . '/lib/logging_helpers.php';

echo "=== WS4 Logging System Test ===\n\n";

// Test 1: Basic logging functionality
echo "Test 1: Basic logging functionality\n";
$traceId1 = log_info('Test info message');
echo "✓ Info logged with trace ID: $traceId1\n";

$traceId2 = log_warning('Test warning message');
echo "✓ Warning logged with trace ID: $traceId2\n";

$traceId3 = log_error('Test error message');
echo "✓ Error logged with trace ID: $traceId3\n\n";

// Test 2: PII scrubbing
echo "Test 2: PII scrubbing functionality\n";
$testMessages = [
    'User email test@example.com attempted login',
    'Phone number 555-123-4567 provided',
    'API key sk-1234567890abcdef1234567890abcdef used',
    'Credit card 4111-1111-1111-1111 entered',
    'SSN 123-45-6789 in form data'
];

foreach ($testMessages as $i => $message) {
    $traceId = log_warning($message);
    echo "✓ PII test " . ($i + 1) . " logged with trace ID: $traceId\n";
}
echo "\n";

// Test 3: Security logging
echo "Test 3: Security event logging\n";
$traceId4 = log_security('Failed login attempt', [
    'attempts' => 3,
    'user_agent' => 'Mozilla/5.0...',
    'ip_address' => '192.168.1.100'
]);
echo "✓ Security event logged with trace ID: $traceId4\n\n";

// Test 4: Abuse logging
echo "Test 4: Abuse detection logging\n";
$traceId5 = log_abuse('chat123', 'user456', 'This message contains my email test@example.com and phone 555-1234', [
    'detection_method' => 'keyword_match',
    'severity' => 'medium'
]);
echo "✓ Abuse event logged with trace ID: $traceId5\n\n";

// Test 5: API call logging
echo "Test 5: API call logging\n";
$traceId6 = log_api_call('/api/chat', 'POST', ['message' => 'test'], ['reply' => 'response'], 150);
echo "✓ API call logged with trace ID: $traceId6\n\n";

// Test 6: Context with nested PII
echo "Test 6: Context with nested PII scrubbing\n";
$complexContext = [
    'user' => [
        'email' => 'user@example.com',
        'phone' => '555-987-6543',
        'name' => 'John Doe'
    ],
    'request' => [
        'api_key' => 'sk-abcdef1234567890abcdef1234567890',
        'data' => 'Some request data'
    ]
];
$traceId7 = log_info('Complex context test', $complexContext);
echo "✓ Complex context logged with trace ID: $traceId7\n\n";

// Test 7: Get logging statistics
echo "Test 7: Logging statistics\n";
$stats = get_log_stats();
echo "✓ Log directory: " . $stats['log_dir'] . "\n";
echo "✓ Total files: " . $stats['file_count'] . "\n";
echo "✓ Total size: " . number_format($stats['total_size']) . " bytes\n";

if (!empty($stats['files'])) {
    echo "✓ Log files created:\n";
    foreach ($stats['files'] as $file) {
        echo "  - " . $file['name'] . " (" . number_format($file['size']) . " bytes)\n";
    }
}
echo "\n";

// Test 8: Test enhanced error_log wrapper
echo "Test 8: Enhanced error_log wrapper\n";
$traceId8 = enhanced_error_log('Test enhanced error log message');
echo "✓ Enhanced error_log with trace ID: $traceId8\n\n";

echo "=== All Tests Completed ===\n";
echo "Check the logs directory for generated log files.\n";
echo "Verify that PII has been properly scrubbed in the log entries.\n";
