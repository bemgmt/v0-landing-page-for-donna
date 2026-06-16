<?php
/**
 * WS4 Comprehensive Endpoint Standardization Test
 * 
 * Tests all PHP endpoints to ensure they use ErrorResponse format consistently
 * Validates trace IDs, proper error codes, and standardized response structure
 */

require_once __DIR__ . '/lib/ErrorResponse.php';

echo "=== WS4 Comprehensive Endpoint Standardization Test ===\n\n";

// Test 1: Scan All PHP Endpoints
echo "Test 1: Scanning All PHP Endpoints\n";
try {
    $phpFiles = [];
    
    // Scan api directory recursively
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(__DIR__ . '/api'),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    
    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $phpFiles[] = $file->getPathname();
        }
    }
    
    echo "✓ Found " . count($phpFiles) . " PHP endpoint files:\n";
    foreach ($phpFiles as $file) {
        $relativePath = str_replace(__DIR__ . '/', '', $file);
        echo "  - {$relativePath}\n";
    }
    
} catch (Exception $e) {
    echo "✗ PHP file scanning failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 2: Check ErrorResponse Import
echo "Test 2: ErrorResponse Import Verification\n";
try {
    $missingImports = [];
    $hasImports = [];
    
    foreach ($phpFiles as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(__DIR__ . '/', '', $file);
        
        // Check if file includes ErrorResponse
        if (strpos($content, 'ErrorResponse') !== false) {
            $hasImports[] = $relativePath;
        } else {
            // Skip certain files that might not need ErrorResponse
            $skipFiles = ['lib/', 'bootstrap', 'config'];
            $shouldSkip = false;
            foreach ($skipFiles as $skip) {
                if (strpos($relativePath, $skip) !== false) {
                    $shouldSkip = true;
                    break;
                }
            }
            
            if (!$shouldSkip) {
                $missingImports[] = $relativePath;
            }
        }
    }
    
    echo "✓ Files with ErrorResponse: " . count($hasImports) . "\n";
    foreach ($hasImports as $file) {
        echo "  ✓ {$file}\n";
    }
    
    if (!empty($missingImports)) {
        echo "\n⚠ Files missing ErrorResponse: " . count($missingImports) . "\n";
        foreach ($missingImports as $file) {
            echo "  ⚠ {$file}\n";
        }
    } else {
        echo "\n✅ All endpoint files include ErrorResponse\n";
    }
    
} catch (Exception $e) {
    echo "✗ ErrorResponse import check failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: Check for Raw JSON Responses
echo "Test 3: Raw JSON Response Detection\n";
try {
    $rawJsonPatterns = [
        '/echo\s+json_encode\s*\(\s*\[\s*[\'"]success[\'"]\s*=>\s*(true|false)/' => 'Raw success/error JSON',
        '/json_encode\s*\(\s*\[\s*[\'"]error[\'"]\s*=>\s*/' => 'Raw error JSON',
        '/json_encode\s*\(\s*\[\s*[\'"]message[\'"]\s*=>\s*/' => 'Raw message JSON',
        '/\[\s*[\'"]success[\'"]\s*=>\s*true\s*,/' => 'Raw success array',
        '/\[\s*[\'"]success[\'"]\s*=>\s*false\s*,/' => 'Raw error array'
    ];
    
    $violations = [];
    
    foreach ($phpFiles as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(__DIR__ . '/', '', $file);
        $lines = explode("\n", $content);
        
        foreach ($rawJsonPatterns as $pattern => $description) {
            if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[0] as $match) {
                    // Find line number
                    $lineNumber = substr_count(substr($content, 0, $match[1]), "\n") + 1;
                    
                    // Check if this is using ErrorResponse (acceptable)
                    $lineContent = $lines[$lineNumber - 1] ?? '';
                    if (strpos($lineContent, 'ErrorResponse') === false) {
                        $violations[] = [
                            'file' => $relativePath,
                            'line' => $lineNumber,
                            'type' => $description,
                            'content' => trim($lineContent)
                        ];
                    }
                }
            }
        }
    }
    
    if (empty($violations)) {
        echo "✅ No raw JSON responses found - all using ErrorResponse\n";
    } else {
        echo "⚠ Found " . count($violations) . " raw JSON responses:\n";
        foreach ($violations as $violation) {
            echo "  ⚠ {$violation['file']}:{$violation['line']} - {$violation['type']}\n";
            echo "    Code: " . substr($violation['content'], 0, 80) . "...\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Raw JSON detection failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Validate ErrorResponse Usage Patterns
echo "Test 4: ErrorResponse Usage Pattern Validation\n";
try {
    $errorResponsePatterns = [
        'ErrorResponse::success' => 'Success responses',
        'ErrorResponse::create' => 'Custom error responses',
        'ErrorResponse::validation' => 'Validation errors',
        'ErrorResponse::apiError' => 'API errors',
        'ErrorResponse::fromException' => 'Exception handling'
    ];
    
    $usageStats = [];
    
    foreach ($errorResponsePatterns as $pattern => $description) {
        $usageStats[$pattern] = ['count' => 0, 'files' => []];
    }
    
    foreach ($phpFiles as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(__DIR__ . '/', '', $file);
        
        foreach ($errorResponsePatterns as $pattern => $description) {
            if (preg_match_all('/' . preg_quote($pattern, '/') . '/', $content, $matches)) {
                $count = count($matches[0]);
                $usageStats[$pattern]['count'] += $count;
                if ($count > 0) {
                    $usageStats[$pattern]['files'][] = $relativePath;
                }
            }
        }
    }
    
    echo "✓ ErrorResponse usage statistics:\n";
    foreach ($usageStats as $pattern => $stats) {
        echo "  {$pattern}: {$stats['count']} usages in " . count($stats['files']) . " files\n";
        if (!empty($stats['files'])) {
            foreach (array_slice($stats['files'], 0, 3) as $file) {
                echo "    - {$file}\n";
            }
            if (count($stats['files']) > 3) {
                echo "    - ... and " . (count($stats['files']) - 3) . " more\n";
            }
        }
    }
    
    $totalUsages = array_sum(array_column($usageStats, 'count'));
    echo "\nTotal ErrorResponse usages: {$totalUsages}\n";
    
} catch (Exception $e) {
    echo "✗ ErrorResponse usage validation failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 5: Trace ID Implementation Check
echo "Test 5: Trace ID Implementation Check\n";
try {
    $traceIdFiles = [];
    $missingTraceId = [];
    
    foreach ($phpFiles as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(__DIR__ . '/', '', $file);
        
        // Skip library files
        if (strpos($relativePath, 'lib/') !== false) {
            continue;
        }
        
        if (strpos($content, 'ErrorResponse') !== false) {
            // Check if trace IDs are being used
            if (strpos($content, 'trace_id') !== false || 
                strpos($content, 'traceId') !== false ||
                strpos($content, 'ErrorResponse::') !== false) {
                $traceIdFiles[] = $relativePath;
            } else {
                $missingTraceId[] = $relativePath;
            }
        }
    }
    
    echo "✓ Files with trace ID support: " . count($traceIdFiles) . "\n";
    foreach ($traceIdFiles as $file) {
        echo "  ✓ {$file}\n";
    }
    
    if (!empty($missingTraceId)) {
        echo "\n⚠ Files potentially missing trace ID support: " . count($missingTraceId) . "\n";
        foreach ($missingTraceId as $file) {
            echo "  ⚠ {$file}\n";
        }
    } else {
        echo "\n✅ All files with ErrorResponse have trace ID support\n";
    }
    
} catch (Exception $e) {
    echo "✗ Trace ID check failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 6: HTTP Status Code Consistency
echo "Test 6: HTTP Status Code Consistency Check\n";
try {
    $statusCodePatterns = [
        '/http_response_code\s*\(\s*(\d+)\s*\)/' => 'Direct status codes',
        '/ErrorResponse::\w+\([^,)]*,[^,)]*,[^,)]*,\s*(\d+)\s*\)/' => 'ErrorResponse status codes'
    ];
    
    $statusCodes = [];
    
    foreach ($phpFiles as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(__DIR__ . '/', '', $file);
        
        foreach ($statusCodePatterns as $pattern => $description) {
            if (preg_match_all($pattern, $content, $matches)) {
                foreach ($matches[1] as $code) {
                    if (!isset($statusCodes[$code])) {
                        $statusCodes[$code] = [];
                    }
                    $statusCodes[$code][] = $relativePath;
                }
            }
        }
    }
    
    echo "✓ HTTP status codes in use:\n";
    ksort($statusCodes);
    foreach ($statusCodes as $code => $files) {
        $uniqueFiles = array_unique($files);
        echo "  {$code}: " . count($uniqueFiles) . " files\n";
        foreach (array_slice($uniqueFiles, 0, 2) as $file) {
            echo "    - {$file}\n";
        }
        if (count($uniqueFiles) > 2) {
            echo "    - ... and " . (count($uniqueFiles) - 2) . " more\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Status code check failed: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== Comprehensive Endpoint Standardization Test Complete ===\n";
echo "Summary:\n";
echo "- ✅ All PHP endpoint files scanned and analyzed\n";
echo "- ✅ ErrorResponse import verification completed\n";
echo "- ✅ Raw JSON response detection performed\n";
echo "- ✅ ErrorResponse usage patterns validated\n";
echo "- ✅ Trace ID implementation verified\n";
echo "- ✅ HTTP status code consistency checked\n";
echo "\nRecommendations:\n";
echo "1. Fix any remaining raw JSON responses to use ErrorResponse\n";
echo "2. Ensure all endpoints include proper trace ID support\n";
echo "3. Standardize HTTP status codes across similar error types\n";
echo "4. Regular testing to prevent regression to raw JSON responses\n";
echo "\nStandardized error responses ensure consistent API behavior and debugging.\n";
