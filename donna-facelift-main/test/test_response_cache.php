#!/usr/bin/env php
<?php
/**
 * Response Cache Test Suite
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Tests response caching functionality
 * 
 * Usage: php test/test_response_cache.php [--verbose]
 */

require_once __DIR__ . '/../lib/CacheManager.php';
require_once __DIR__ . '/../lib/FileCacheAdapter.php';
require_once __DIR__ . '/../lib/ErrorResponse.php';
require_once __DIR__ . '/../api/lib/response-cache.php';

// Configuration
$verbose = in_array('--verbose', $argv ?? []);
$testsPassed = 0;
$testsFailed = 0;
$testResults = [];

// Colors for output
$GREEN = "\033[32m";
$RED = "\033[31m";
$YELLOW = "\033[33m";
$BLUE = "\033[34m";
$RESET = "\033[0m";

// Test helper functions
function test($name, $callback) {
    global $testsPassed, $testsFailed, $testResults, $verbose, $GREEN, $RED, $RESET;
    
    try {
        $result = $callback();
        if ($result) {
            $testsPassed++;
            $status = "{$GREEN}PASS{$RESET}";
            $testResults[] = ['name' => $name, 'status' => 'PASS', 'message' => ''];
            if ($verbose) {
                echo "  ✓ {$name} - {$status}\n";
            }
        } else {
            $testsFailed++;
            $status = "{$RED}FAIL{$RESET}";
            $testResults[] = ['name' => $name, 'status' => 'FAIL', 'message' => 'Assertion failed'];
            echo "  ✗ {$name} - {$status}\n";
        }
    } catch (Exception $e) {
        $testsFailed++;
        $status = "{$RED}ERROR{$RESET}";
        $message = $e->getMessage();
        $testResults[] = ['name' => $name, 'status' => 'ERROR', 'message' => $message];
        echo "  ✗ {$name} - {$status}: {$message}\n";
    }
}

function assertEqual($actual, $expected, $message = '') {
    if ($actual !== $expected) {
        throw new Exception($message ?: "Expected " . var_export($expected, true) . " but got " . var_export($actual, true));
    }
    return true;
}

function assertNotNull($value, $message = '') {
    if ($value === null) {
        throw new Exception($message ?: "Expected non-null value");
    }
    return true;
}

function assertTrue($value, $message = '') {
    if ($value !== true) {
        throw new Exception($message ?: "Expected true but got " . var_export($value, true));
    }
    return true;
}

function assertFalse($value, $message = '') {
    if ($value !== false) {
        throw new Exception($message ?: "Expected false but got " . var_export($value, true));
    }
    return true;
}

function assertGreaterThan($value, $threshold, $message = '') {
    if ($value <= $threshold) {
        throw new Exception($message ?: "Expected value > {$threshold} but got {$value}");
    }
    return true;
}

// Clean up test cache directory
function cleanupTestCache() {
    $testCacheDir = __DIR__ . '/../cache/test';
    if (is_dir($testCacheDir)) {
        $files = glob($testCacheDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
}

echo "\n{$BLUE}=== Response Cache Test Suite ==={$RESET}\n\n";

// Setup test environment
putenv('CACHE_ENABLED=true');
putenv('CACHE_DIR=' . __DIR__ . '/../cache/test');
cleanupTestCache();

// Test 1: Basic CacheManager functionality
echo "{$YELLOW}Testing CacheManager...{$RESET}\n";

test('CacheManager instantiation', function() {
    $cache = new CacheManager();
    return $cache !== null;
});

test('CacheManager set and get', function() {
    $cache = new CacheManager();
    $key = 'test_key_' . uniqid();
    $value = ['test' => 'data', 'timestamp' => time()];
    
    assertTrue($cache->set($key, $value, 60));
    $retrieved = $cache->get($key);
    assertEqual($retrieved, $value);
    return true;
});

test('CacheManager cache miss', function() {
    $cache = new CacheManager();
    $key = 'non_existent_key_' . uniqid();
    $value = $cache->get($key);
    assertEqual($value, null);
    return true;
});

test('CacheManager delete', function() {
    $cache = new CacheManager();
    $key = 'test_delete_' . uniqid();
    $value = 'test_value';
    
    $cache->set($key, $value, 60);
    assertTrue($cache->delete($key));
    assertEqual($cache->get($key), null);
    return true;
});

test('CacheManager remember function', function() {
    $cache = new CacheManager();
    $key = 'test_remember_' . uniqid();
    $callCount = 0;
    
    $value1 = $cache->remember($key, function() use (&$callCount) {
        $callCount++;
        return 'generated_value';
    }, 60);
    
    $value2 = $cache->remember($key, function() use (&$callCount) {
        $callCount++;
        return 'should_not_be_called';
    }, 60);
    
    assertEqual($value1, 'generated_value');
    assertEqual($value2, 'generated_value');
    assertEqual($callCount, 1, 'Callback should only be called once');
    return true;
});

test('CacheManager key generation', function() {
    $cache = new CacheManager();
    
    $key1 = $cache->key('namespace', 'identifier', ['param1' => 'value1']);
    $key2 = $cache->key('namespace', 'identifier', ['param1' => 'value1']);
    $key3 = $cache->key('namespace', 'identifier', ['param1' => 'value2']);
    
    assertEqual($key1, $key2, 'Same parameters should generate same key');
    assertTrue($key1 !== $key3, 'Different parameters should generate different keys');
    return true;
});

// Test 2: ResponseCache functionality
echo "\n{$YELLOW}Testing ResponseCache...{$RESET}\n";

test('ResponseCache instantiation', function() {
    $cache = ResponseCache::getInstance();
    return $cache !== null;
});

test('ResponseCache singleton', function() {
    $cache1 = ResponseCache::getInstance();
    $cache2 = ResponseCache::getInstance();
    assertTrue($cache1 === $cache2, 'Should return same instance');
    return true;
});

test('ResponseCache cacheGet with callback', function() {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $cache = ResponseCache::getInstance();
    $endpoint = 'test_endpoint_' . uniqid();
    $callCount = 0;
    
    $response1 = $cache->cacheGet($endpoint, [], function() use (&$callCount) {
        $callCount++;
        return ['data' => 'test_data', 'count' => $callCount];
    }, 60);
    
    $response2 = $cache->cacheGet($endpoint, [], function() use (&$callCount) {
        $callCount++;
        return ['data' => 'should_not_be_called', 'count' => $callCount];
    }, 60);
    
    assertEqual($response1['data'], 'test_data');
    assertEqual($response2['data'], 'test_data');
    assertEqual($callCount, 1, 'Callback should only be called once');
    assertTrue($response1['cache']['hit'] === false, 'First call should be cache miss');
    assertTrue($response2['cache']['hit'] === true, 'Second call should be cache hit');
    return true;
});

test('ResponseCache different parameters', function() {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $cache = ResponseCache::getInstance();
    $endpoint = 'test_params_' . uniqid();
    
    $response1 = $cache->cacheGet($endpoint, ['id' => 1], function() {
        return ['data' => 'response_1'];
    }, 60);
    
    $response2 = $cache->cacheGet($endpoint, ['id' => 2], function() {
        return ['data' => 'response_2'];
    }, 60);
    
    assertEqual($response1['data'], 'response_1');
    assertEqual($response2['data'], 'response_2');
    return true;
});

test('ResponseCache POST requests not cached', function() {
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $cache = ResponseCache::getInstance();
    $endpoint = 'test_post_' . uniqid();
    $callCount = 0;
    
    $response1 = $cache->cacheGet($endpoint, [], function() use (&$callCount) {
        $callCount++;
        return ['data' => 'call_' . $callCount];
    }, 60);
    
    $response2 = $cache->cacheGet($endpoint, [], function() use (&$callCount) {
        $callCount++;
        return ['data' => 'call_' . $callCount];
    }, 60);
    
    assertEqual($response1['data'], 'call_1');
    assertEqual($response2['data'], 'call_2');
    assertEqual($callCount, 2, 'POST requests should not be cached');
    return true;
});

test('ResponseCache invalidation', function() {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $cache = ResponseCache::getInstance();
    $endpoint = 'test_invalidate_' . uniqid();
    
    // Cache a response
    $response1 = $cache->cacheGet($endpoint, ['id' => 1], function() {
        return ['data' => 'original'];
    }, 60);
    
    // Invalidate specific entry
    assertTrue($cache->invalidate($endpoint, ['id' => 1]));
    
    // Should generate new response
    $response2 = $cache->cacheGet($endpoint, ['id' => 1], function() {
        return ['data' => 'new'];
    }, 60);
    
    assertEqual($response2['data'], 'new');
    assertTrue($response2['cache']['hit'] === false);
    return true;
});

test('ResponseCache TTL configuration', function() {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $cache = ResponseCache::getInstance();
    
    // Test automatic TTL detection
    $healthResponse = $cache->cacheGet('health_check', [], function() {
        return ['status' => 'ok'];
    });
    assertEqual($healthResponse['cache']['ttl'], 10, 'Health endpoint should have 10s TTL');
    
    $statsResponse = $cache->cacheGet('system_stats', [], function() {
        return ['stats' => 'data'];
    });
    assertEqual($statsResponse['cache']['ttl'], 60, 'Stats endpoint should have 60s TTL');
    
    $settingsResponse = $cache->cacheGet('user_settings', [], function() {
        return ['settings' => 'data'];
    });
    assertEqual($settingsResponse['cache']['ttl'], 300, 'Settings endpoint should have 300s TTL');
    
    return true;
});

// Test 3: FileCacheAdapter functionality
echo "\n{$YELLOW}Testing FileCacheAdapter...{$RESET}\n";

test('FileCacheAdapter instantiation', function() {
    $adapter = new FileCacheAdapter();
    return $adapter !== null;
});

test('FileCacheAdapter set and get', function() {
    $adapter = new FileCacheAdapter();
    $key = 'file_test_' . uniqid();
    $value = ['test' => 'data', 'nested' => ['value' => 123]];
    
    assertTrue($adapter->set($key, $value, 60));
    $retrieved = $adapter->get($key);
    assertEqual($retrieved, $value);
    return true;
});

test('FileCacheAdapter expiration', function() {
    $adapter = new FileCacheAdapter();
    $key = 'expire_test_' . uniqid();
    $value = 'test_value';
    
    // Set with 1 second TTL
    assertTrue($adapter->set($key, $value, 1));
    assertEqual($adapter->get($key), $value);
    
    // Wait for expiration
    sleep(2);
    assertEqual($adapter->get($key), null, 'Value should be expired');
    return true;
});

test('FileCacheAdapter cleanup', function() {
    $adapter = new FileCacheAdapter();
    
    // Create some expired entries
    for ($i = 0; $i < 3; $i++) {
        $adapter->set('cleanup_test_' . $i, 'value', 1);
    }
    
    // Create some valid entries
    for ($i = 3; $i < 6; $i++) {
        $adapter->set('cleanup_test_' . $i, 'value', 60);
    }
    
    // Wait for first set to expire
    sleep(2);
    
    $cleaned = $adapter->cleanup();
    assertGreaterThan($cleaned, 0, 'Should clean up expired entries');
    
    // Valid entries should still exist
    for ($i = 3; $i < 6; $i++) {
        assertNotNull($adapter->get('cleanup_test_' . $i));
    }
    
    return true;
});

test('FileCacheAdapter statistics', function() {
    $adapter = new FileCacheAdapter();
    $stats = $adapter->getStats();
    
    assertNotNull($stats['adapter']);
    assertEqual($stats['adapter'], 'file');
    assertNotNull($stats['cache_directory']);
    assertTrue(isset($stats['total_files']));
    assertTrue(isset($stats['total_size_mb']));
    return true;
});

// Test 4: Cache Metrics
echo "\n{$YELLOW}Testing Cache Metrics...{$RESET}\n";

test('CacheMetrics tracking', function() {
    $cache = new CacheManager();
    $cache->resetMetrics();
    
    // Generate some cache activity
    $cache->set('metrics_test_1', 'value1', 60);
    $cache->get('metrics_test_1'); // Hit
    $cache->get('metrics_test_nonexistent'); // Miss
    $cache->delete('metrics_test_1');
    
    $metrics = $cache->getMetrics();
    
    assertGreaterThan($metrics['hits'], 0);
    assertGreaterThan($metrics['misses'], 0);
    assertGreaterThan($metrics['sets'], 0);
    assertGreaterThan($metrics['deletes'], 0);
    assertTrue(isset($metrics['hit_rate_percent']));
    
    return true;
});

// Test 5: Error Handling
echo "\n{$YELLOW}Testing Error Handling...{$RESET}\n";

test('Cache continues on adapter failure', function() {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Create cache with invalid directory
    putenv('CACHE_DIR=/invalid/path/that/does/not/exist');
    
    try {
        $cache = new CacheManager();
        // Should fall back gracefully
        $value = $cache->get('test_key');
        assertEqual($value, null);
        return true;
    } catch (Exception $e) {
        // Reset cache directory
        putenv('CACHE_DIR=' . __DIR__ . '/../cache/test');
        throw $e;
    } finally {
        // Reset cache directory
        putenv('CACHE_DIR=' . __DIR__ . '/../cache/test');
    }
});

// Clean up
echo "\n{$YELLOW}Cleaning up...{$RESET}\n";
cleanupTestCache();

// Summary
echo "\n{$BLUE}=== Test Summary ==={$RESET}\n";
echo "Tests Passed: {$GREEN}{$testsPassed}{$RESET}\n";
echo "Tests Failed: {$RED}{$testsFailed}{$RESET}\n";

if ($testsFailed > 0) {
    echo "\n{$RED}Failed Tests:{$RESET}\n";
    foreach ($testResults as $result) {
        if ($result['status'] !== 'PASS') {
            echo "  - {$result['name']}: {$result['message']}\n";
        }
    }
    exit(1);
} else {
    echo "\n{$GREEN}All tests passed!{$RESET}\n";
    exit(0);
}