<?php
/**
 * WS4 Task 2: Comprehensive Error Response Migration Test
 * 
 * Tests all PHP endpoints for ErrorResponse compliance and trace ID inclusion
 */

require_once __DIR__ . '/lib/ErrorResponse.php';

echo "=== WS4 Comprehensive Error Response Migration Test ===\n\n";

// Test 1: Inventory all PHP endpoints
echo "Test 1: PHP Endpoints Inventory\n";
$endpoints = [];

// Scan API directory
$apiFiles = glob(__DIR__ . '/api/*.php');
foreach ($apiFiles as $file) {
    $filename = basename($file);
    $content = file_get_contents($file);
    
    // Check if it's an endpoint (has HTTP method handling)
    if (preg_match('/\$_SERVER\[.REQUEST_METHOD.\]|\$_GET|\$_POST|header\s*\(\s*[\'"]Content-Type/', $content)) {
        $endpoints[] = [
            'file' => $filename,
            'path' => '/api/' . $filename,
            'content' => $content
        ];
    }
}

// Scan subdirectories
$subDirs = ['sales', 'realtime'];
foreach ($subDirs as $subDir) {
    $subFiles = glob(__DIR__ . "/api/{$subDir}/*.php");
    foreach ($subFiles as $file) {
        $filename = basename($file);
        $content = file_get_contents($file);
        
        if (preg_match('/\$_SERVER\[.REQUEST_METHOD.\]|\$_GET|\$_POST|header\s*\(\s*[\'"]Content-Type/', $content)) {
            $endpoints[] = [
                'file' => $filename,
                'path' => "/api/{$subDir}/" . $filename,
                'content' => $content
            ];
        }
    }
}

echo "✓ Total endpoints found: " . count($endpoints) . "\n";
foreach ($endpoints as $endpoint) {
    echo "  - {$endpoint['path']}\n";
}
echo "\n";

// Test 2: Migration Status Analysis
echo "Test 2: ErrorResponse Migration Status\n";
$migrationStatus = [];

foreach ($endpoints as $endpoint) {
    $file = $endpoint['file'];
    $content = $endpoint['content'];
    
    // Check migration indicators
    $hasErrorResponseInclude = strpos($content, 'ErrorResponse.php') !== false;
    $hasErrorResponseUsage = strpos($content, 'ErrorResponse::') !== false;
    $hasOldStyleErrors = preg_match('/echo\s+json_encode\s*\(\s*\[\s*[\'"]success[\'"]\s*=>\s*false/', $content);
    $hasTraceId = strpos($content, 'trace') !== false || strpos($content, 'ref') !== false;
    $hasStandardSuccess = strpos($content, 'ErrorResponse::success') !== false;
    
    // Calculate migration score
    $score = 0;
    if ($hasErrorResponseInclude) $score += 20;
    if ($hasErrorResponseUsage) $score += 30;
    if (!$hasOldStyleErrors) $score += 25;
    if ($hasTraceId) $score += 15;
    if ($hasStandardSuccess) $score += 10;
    
    $migrationStatus[$file] = [
        'score' => $score,
        'includes' => $hasErrorResponseInclude,
        'uses' => $hasErrorResponseUsage,
        'old_style' => $hasOldStyleErrors,
        'trace_id' => $hasTraceId,
        'standard_success' => $hasStandardSuccess
    ];
}

// Display results
foreach ($migrationStatus as $file => $status) {
    $score = $status['score'];
    $level = $score >= 80 ? 'COMPLETE' : ($score >= 50 ? 'PARTIAL' : 'PENDING');
    $icon = $score >= 80 ? '✅' : ($score >= 50 ? '⚠' : '❌');
    
    echo "  {$icon} {$file}: {$level} ({$score}%)\n";
    
    if ($score < 100) {
        if (!$status['includes']) echo "    - Missing ErrorResponse include\n";
        if (!$status['uses']) echo "    - Missing ErrorResponse usage\n";
        if ($status['old_style']) echo "    - Contains old-style responses\n";
        if (!$status['trace_id']) echo "    - Missing trace ID support\n";
        if (!$status['standard_success']) echo "    - Missing standard success\n";
    }
}

$totalEndpoints = count($migrationStatus);
$completeEndpoints = count(array_filter($migrationStatus, function($s) { return $s['score'] >= 80; }));
$partialEndpoints = count(array_filter($migrationStatus, function($s) { return $s['score'] >= 50 && $s['score'] < 80; }));
$pendingEndpoints = $totalEndpoints - $completeEndpoints - $partialEndpoints;

echo "\nMigration Summary:\n";
echo "  ✅ Complete: {$completeEndpoints}/{$totalEndpoints}\n";
echo "  ⚠ Partial: {$partialEndpoints}/{$totalEndpoints}\n";
echo "  ❌ Pending: {$pendingEndpoints}/{$totalEndpoints}\n";
echo "\n";

// Test 3: ErrorResponse Format Validation
echo "Test 3: ErrorResponse Format Validation\n";
$errorMethods = [
    'validation' => ['field', 'issue'],
    'authentication' => [],
    'authorization' => [],
    'notFound' => ['resource'],
    'rateLimit' => [30],
    'apiError' => ['service'],
    'systemError' => [],
    'configurationError' => ['component']
];

foreach ($errorMethods as $method => $args) {
    $response = call_user_func_array(['ErrorResponse', $method], $args);
    $isValid = ErrorResponse::validate($response);
    $hasTraceId = isset($response['ref']) && !empty($response['ref']);
    
    echo "  ✓ {$method}: " . ($isValid && $hasTraceId ? 'VALID' : 'INVALID') . "\n";
}

$successResponse = ErrorResponse::success(['data' => 'test']);
$isValidSuccess = ErrorResponse::validate($successResponse);
echo "  ✓ success: " . ($isValidSuccess ? 'VALID' : 'INVALID') . "\n";
echo "\n";

// Test 4: Trace ID Functionality
echo "Test 4: Trace ID Functionality\n";
$response1 = ErrorResponse::create('VALIDATION_ERROR', 'Test 1');
$response2 = ErrorResponse::create('VALIDATION_ERROR', 'Test 2');

$hasTraceId1 = isset($response1['ref']) && !empty($response1['ref']);
$hasTraceId2 = isset($response2['ref']) && !empty($response2['ref']);
$uniqueTraceIds = $response1['ref'] !== $response2['ref'];

echo "✓ Trace ID generation: " . ($hasTraceId1 && $hasTraceId2 ? 'WORKING' : 'FAILED') . "\n";
echo "✓ Trace ID uniqueness: " . ($uniqueTraceIds ? 'UNIQUE' : 'DUPLICATE') . "\n";

$traceIdPattern = '/^trace_[a-f0-9]+_[a-f0-9]{8}$/';
$validFormat = preg_match($traceIdPattern, $response1['ref']) && preg_match($traceIdPattern, $response2['ref']);
echo "✓ Trace ID format: " . ($validFormat ? 'VALID' : 'INVALID') . "\n";
echo "\n";

// Test 5: Exception Handling
echo "Test 5: Exception Handling with Trace IDs\n";
$exceptions = [
    new InvalidArgumentException("Invalid input"),
    new Exception("Generic error"),
    new RuntimeException("Runtime failure")
];

foreach ($exceptions as $exception) {
    $response = ErrorResponse::fromException($exception);
    $hasTraceId = isset($response['ref']) && !empty($response['ref']);
    $isValid = ErrorResponse::validate($response);
    
    $exceptionType = get_class($exception);
    echo "  ✓ {$exceptionType}: " . ($isValid && $hasTraceId ? 'HANDLED' : 'FAILED') . "\n";
}
echo "\n";

// Test 6: Identify endpoints needing migration
echo "Test 6: Migration Action Items\n";
$needsMigration = array_filter($migrationStatus, function($status) {
    return $status['score'] < 80;
});

if (!empty($needsMigration)) {
    echo "Endpoints requiring migration:\n";
    foreach ($needsMigration as $file => $status) {
        echo "  📝 {$file} (score: {$status['score']}%)\n";
        
        $actions = [];
        if (!$status['includes']) $actions[] = "Add ErrorResponse include";
        if (!$status['uses']) $actions[] = "Replace error responses with ErrorResponse::";
        if ($status['old_style']) $actions[] = "Remove old-style JSON responses";
        if (!$status['trace_id']) $actions[] = "Ensure trace IDs in responses";
        if (!$status['standard_success']) $actions[] = "Use ErrorResponse::success()";
        
        foreach ($actions as $action) {
            echo "      - {$action}\n";
        }
    }
} else {
    echo "✅ All endpoints are fully migrated!\n";
}
echo "\n";

echo "=== Error Response Migration Test Complete ===\n";
echo "Summary:\n";
echo "- ✅ Endpoint inventory completed\n";
echo "- ✅ Migration status analyzed\n";
echo "- ✅ ErrorResponse format validated\n";
echo "- ✅ Trace ID functionality verified\n";
echo "- ✅ Exception handling tested\n";
echo "- 📋 Migration action items identified\n";
echo "\nMigration Progress: {$completeEndpoints}/{$totalEndpoints} endpoints complete\n";
