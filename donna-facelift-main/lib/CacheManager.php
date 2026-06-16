<?php
/**
 * Cache Manager for Response Caching
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Phase 5 Task 5.1: Response caching implementation
 * 
 * Implements read-through cache for idempotent endpoints with metrics
 */

require_once __DIR__ . '/logging_helpers.php';

class CacheManager {
    
    private $adapter;
    private $defaultTtl;
    private $metrics;
    private $enabled;
    
    public function __construct(?CacheAdapterInterface $adapter = null, int $defaultTtl = 300) {
        $this->adapter = $adapter ?: $this->createDefaultAdapter();
        $this->defaultTtl = $defaultTtl;
        $this->metrics = new CacheMetrics();
        $this->enabled = getenv('CACHE_ENABLED') !== 'false';
    }
    
    /**
     * Get value from cache or execute callback to generate it
     */
    public function remember(string $key, callable $callback, ?int $ttl = null): mixed {
        if (!$this->enabled) {
            $this->metrics->recordMiss($key, 'disabled');
            return $callback();
        }
        
        $ttl = $ttl ?? $this->defaultTtl;
        $startTime = microtime(true);
        
        try {
            // Try to get from cache
            $cached = $this->adapter->get($key);
            if ($cached !== null) {
                $this->metrics->recordHit($key, microtime(true) - $startTime);
                return $cached;
            }
            
            // Cache miss - execute callback
            $value = $callback();
            
            // Store in cache
            $this->adapter->set($key, $value, $ttl);
            $this->metrics->recordMiss($key, 'not_found', microtime(true) - $startTime);
            
            return $value;
            
        } catch (Exception $e) {
            log_error('Cache operation failed', [
                'key' => $key,
                'error' => $e->getMessage(),
                'adapter' => get_class($this->adapter)
            ]);
            
            $this->metrics->recordMiss($key, 'error');
            return $callback();
        }
    }
    
    /**
     * Get value from cache
     */
    public function get(string $key): mixed {
        if (!$this->enabled) {
            return null;
        }
        
        $startTime = microtime(true);
        
        try {
            $value = $this->adapter->get($key);
            
            if ($value !== null) {
                $this->metrics->recordHit($key, microtime(true) - $startTime);
            } else {
                $this->metrics->recordMiss($key, 'not_found', microtime(true) - $startTime);
            }
            
            return $value;
            
        } catch (Exception $e) {
            log_error('Cache get failed', ['key' => $key, 'error' => $e->getMessage()]);
            $this->metrics->recordMiss($key, 'error');
            return null;
        }
    }
    
    /**
     * Set value in cache
     */
    public function set(string $key, mixed $value, ?int $ttl = null): bool {
        if (!$this->enabled) {
            return false;
        }
        
        $ttl = $ttl ?? $this->defaultTtl;
        
        try {
            $result = $this->adapter->set($key, $value, $ttl);
            $this->metrics->recordSet($key, $result);
            return $result;
            
        } catch (Exception $e) {
            log_error('Cache set failed', ['key' => $key, 'error' => $e->getMessage()]);
            $this->metrics->recordSet($key, false);
            return false;
        }
    }
    
    /**
     * Delete value from cache
     */
    public function delete(string $key): bool {
        if (!$this->enabled) {
            return false;
        }
        
        try {
            $result = $this->adapter->delete($key);
            $this->metrics->recordDelete($key, $result);
            return $result;
            
        } catch (Exception $e) {
            log_error('Cache delete failed', ['key' => $key, 'error' => $e->getMessage()]);
            $this->metrics->recordDelete($key, false);
            return false;
        }
    }
    
    /**
     * Clear all cache entries
     */
    public function clear(): bool {
        if (!$this->enabled) {
            return false;
        }
        
        try {
            $result = $this->adapter->clear();
            $this->metrics->recordClear($result);
            return $result;
            
        } catch (Exception $e) {
            log_error('Cache clear failed', ['error' => $e->getMessage()]);
            $this->metrics->recordClear(false);
            return false;
        }
    }
    
    /**
     * Check if cache is healthy
     */
    public function healthCheck(): array {
        $health = [
            'status' => 'healthy',
            'adapter' => get_class($this->adapter),
            'enabled' => $this->enabled,
            'default_ttl' => $this->defaultTtl,
            'timestamp' => date('c')
        ];
        
        try {
            // Test basic operations
            $testKey = 'health_check_' . uniqid();
            $testValue = 'test_' . time();
            
            $setResult = $this->adapter->set($testKey, $testValue, 60);
            $getValue = $this->adapter->get($testKey);
            $deleteResult = $this->adapter->delete($testKey);
            
            if (!$setResult || $getValue !== $testValue || !$deleteResult) {
                $health['status'] = 'unhealthy';
                $health['issues'] = ['Basic operations failed'];
            }
            
        } catch (Exception $e) {
            $health['status'] = 'unhealthy';
            $health['error'] = $e->getMessage();
        }
        
        return $health;
    }
    
    /**
     * Get cache metrics
     */
    public function getMetrics(): array {
        return $this->metrics->getStats();
    }
    
    /**
     * Reset cache metrics
     */
    public function resetMetrics(): void {
        $this->metrics->reset();
    }
    
    /**
     * Create cache key with namespace
     */
    public function key(string $namespace, string $identifier, array $params = []): string {
        $keyParts = [$namespace, $identifier];
        
        if (!empty($params)) {
            ksort($params); // Ensure consistent ordering
            $keyParts[] = md5(serialize($params));
        }
        
        return implode(':', $keyParts);
    }
    
    /**
     * Cache response for HTTP endpoints
     */
    public function cacheResponse(string $endpoint, array $params, callable $callback, ?int $ttl = null): mixed {
        $cacheKey = $this->key('response', $endpoint, $params);
        return $this->remember($cacheKey, $callback, $ttl);
    }
    
    /**
     * Invalidate cache by pattern
     */
    public function invalidatePattern(string $pattern): int {
        try {
            return $this->adapter->deletePattern($pattern);
        } catch (Exception $e) {
            log_error('Cache pattern invalidation failed', ['pattern' => $pattern, 'error' => $e->getMessage()]);
            return 0;
        }
    }
    
    /**
     * Create default cache adapter based on environment
     */
    private function createDefaultAdapter(): CacheAdapterInterface {
        $adapterType = getenv('CACHE_ADAPTER') ?: 'file';
        
        switch (strtolower($adapterType)) {
            case 'redis':
                return new RedisCacheAdapter();
            case 'apcu':
                return new APCuCacheAdapter();
            case 'file':
            default:
                require_once __DIR__ . '/FileCacheAdapter.php';
                return new FileCacheAdapter();
        }
    }
}

/**
 * Cache Adapter Interface
 */
interface CacheAdapterInterface {
    public function get(string $key): mixed;
    public function set(string $key, mixed $value, int $ttl): bool;
    public function delete(string $key): bool;
    public function clear(): bool;
    public function deletePattern(string $pattern): int;
}

/**
 * Cache Metrics Collector
 */
class CacheMetrics {
    private $stats = [
        'hits' => 0,
        'misses' => 0,
        'sets' => 0,
        'deletes' => 0,
        'errors' => 0,
        'total_hit_time' => 0.0,
        'total_miss_time' => 0.0,
        'start_time' => null
    ];
    
    public function __construct() {
        $this->stats['start_time'] = time();
    }
    
    public function recordHit(string $key, float $duration = 0.0): void {
        $this->stats['hits']++;
        $this->stats['total_hit_time'] += $duration;
    }
    
    public function recordMiss(string $key, string $reason = 'not_found', float $duration = 0.0): void {
        $this->stats['misses']++;
        $this->stats['total_miss_time'] += $duration;
        
        if ($reason === 'error') {
            $this->stats['errors']++;
        }
    }
    
    public function recordSet(string $key, bool $success): void {
        $this->stats['sets']++;
        if (!$success) {
            $this->stats['errors']++;
        }
    }
    
    public function recordDelete(string $key, bool $success): void {
        $this->stats['deletes']++;
        if (!$success) {
            $this->stats['errors']++;
        }
    }
    
    public function recordClear(bool $success): void {
        if (!$success) {
            $this->stats['errors']++;
        }
    }
    
    public function getStats(): array {
        $total = $this->stats['hits'] + $this->stats['misses'];
        $hitRate = $total > 0 ? ($this->stats['hits'] / $total) * 100 : 0;
        $avgHitTime = $this->stats['hits'] > 0 ? $this->stats['total_hit_time'] / $this->stats['hits'] : 0;
        $avgMissTime = $this->stats['misses'] > 0 ? $this->stats['total_miss_time'] / $this->stats['misses'] : 0;
        
        return [
            'hits' => $this->stats['hits'],
            'misses' => $this->stats['misses'],
            'sets' => $this->stats['sets'],
            'deletes' => $this->stats['deletes'],
            'errors' => $this->stats['errors'],
            'hit_rate_percent' => round($hitRate, 2),
            'avg_hit_time_ms' => round($avgHitTime * 1000, 2),
            'avg_miss_time_ms' => round($avgMissTime * 1000, 2),
            'uptime_seconds' => time() - $this->stats['start_time']
        ];
    }
    
    public function reset(): void {
        $this->stats = [
            'hits' => 0,
            'misses' => 0,
            'sets' => 0,
            'deletes' => 0,
            'errors' => 0,
            'total_hit_time' => 0.0,
            'total_miss_time' => 0.0,
            'start_time' => time()
        ];
    }
}
