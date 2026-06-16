<?php
/**
 * Response Cache Helper for PHP Endpoints
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Provides easy caching integration for idempotent endpoints
 */

require_once __DIR__ . '/../../lib/CacheManager.php';
require_once __DIR__ . '/../../lib/ErrorResponse.php';

class ResponseCache {
    
    private static $instance = null;
    private $cacheManager;
    private $enabled;
    
    // Default TTL values for different endpoint types (in seconds)
    const TTL_CONFIG = [
        'health' => 10,        // Health checks - very short
        'settings' => 300,     // Configuration - 5 minutes
        'stats' => 60,         // Statistics - 1 minute
        'conversations' => 30, // Conversation list - 30 seconds
        'dashboard' => 120,    // Dashboard data - 2 minutes
        'voice' => 300,        // Voice configurations - 5 minutes
        'default' => 60        // Default - 1 minute
    ];
    
    private function __construct() {
        $this->cacheManager = new CacheManager();
        $this->enabled = getenv('ENABLE_RESPONSE_CACHE') !== 'false';
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Cache a GET endpoint response
     */
    public function cacheGet(string $endpoint, array $params, callable $callback, ?int $ttl = null): array {
        // Only cache GET requests
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            return $callback();
        }
        
        if (!$this->enabled) {
            $response = $callback();
            $response['cache'] = ['enabled' => false];
            return $response;
        }
        
        // Determine TTL
        if ($ttl === null) {
            $endpointType = $this->getEndpointType($endpoint);
            $ttl = self::TTL_CONFIG[$endpointType] ?? self::TTL_CONFIG['default'];
        }
        
        // Create cache key
        $cacheKey = $this->cacheManager->key('api', $endpoint, $params);
        
        // Try to get from cache
        $cached = $this->cacheManager->get($cacheKey);
        if ($cached !== null) {
            // Add cache metadata
            $cached['cache'] = [
                'hit' => true,
                'ttl' => $ttl,
                'key' => substr($cacheKey, 0, 16) . '...',
                'cached_at' => $cached['_cached_at'] ?? time()
            ];
            
            // Remove internal cache metadata
            unset($cached['_cached_at']);
            
            // Add X-Cache header
            header('X-Cache: HIT');
            header('X-Cache-TTL: ' . $ttl);
            
            return $cached;
        }
        
        // Cache miss - generate response
        $response = $callback();
        
        // Add cache metadata to response
        $response['cache'] = [
            'hit' => false,
            'ttl' => $ttl,
            'key' => substr($cacheKey, 0, 16) . '...'
        ];
        
        // Store in cache with metadata
        $cacheData = $response;
        $cacheData['_cached_at'] = time();
        
        $this->cacheManager->set($cacheKey, $cacheData, $ttl);
        
        // Add X-Cache header
        header('X-Cache: MISS');
        header('X-Cache-TTL: ' . $ttl);
        
        return $response;
    }
    
    /**
     * Invalidate cache for an endpoint
     */
    public function invalidate(string $endpoint, ?array $params = null): bool {
        if (!$this->enabled) {
            return false;
        }
        
        if ($params !== null) {
            // Invalidate specific cache entry
            $cacheKey = $this->cacheManager->key('api', $endpoint, $params);
            return $this->cacheManager->delete($cacheKey);
        } else {
            // Invalidate all entries for the endpoint
            $pattern = 'api:' . $endpoint . ':*';
            $deleted = $this->cacheManager->invalidatePattern($pattern);
            return $deleted > 0;
        }
    }
    
    /**
     * Clear all API response cache
     */
    public function clearAll(): bool {
        if (!$this->enabled) {
            return false;
        }
        
        $deleted = $this->cacheManager->invalidatePattern('api:*');
        return $deleted > 0;
    }
    
    /**
     * Get cache statistics for API responses
     */
    public function getStats(): array {
        $metrics = $this->cacheManager->getMetrics();
        $metrics['enabled'] = $this->enabled;
        $metrics['ttl_config'] = self::TTL_CONFIG;
        
        return $metrics;
    }
    
    /**
     * Wrapper for standard error responses with caching
     */
    public function respondWithCache(string $endpoint, callable $callback, ?int $ttl = null): void {
        try {
            // Get request parameters
            $params = $_GET ?: [];
            
            // Use cache for the response
            $response = $this->cacheGet($endpoint, $params, $callback, $ttl);
            
            // Send response
            header('Content-Type: application/json');
            echo json_encode($response);
            
        } catch (Exception $e) {
            // On error, send error response without caching
            $response = ErrorResponse::fromException($e);
            header('Content-Type: application/json');
            echo json_encode($response);
        }
    }
    
    /**
     * Check if caching is enabled
     */
    public function isEnabled(): bool {
        return $this->enabled;
    }
    
    /**
     * Set cache enabled state (for testing)
     */
    public function setEnabled(bool $enabled): void {
        $this->enabled = $enabled;
    }
    
    /**
     * Get endpoint type from endpoint name
     */
    private function getEndpointType(string $endpoint): string {
        // Extract type from endpoint name
        if (strpos($endpoint, 'health') !== false) return 'health';
        if (strpos($endpoint, 'settings') !== false) return 'settings';
        if (strpos($endpoint, 'stats') !== false || strpos($endpoint, 'metric') !== false) return 'stats';
        if (strpos($endpoint, 'conversation') !== false) return 'conversations';
        if (strpos($endpoint, 'dashboard') !== false || strpos($endpoint, 'overview') !== false) return 'dashboard';
        if (strpos($endpoint, 'voice') !== false) return 'voice';
        
        return 'default';
    }
    
    /**
     * Add cache headers for conditional requests
     */
    public function handleConditionalRequest(string $etag, int $lastModified): bool {
        // Check If-None-Match header
        if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
            if ($_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
                http_response_code(304); // Not Modified
                header('ETag: ' . $etag);
                return true;
            }
        }
        
        // Check If-Modified-Since header
        if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
            $ifModifiedSince = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);
            if ($ifModifiedSince >= $lastModified) {
                http_response_code(304); // Not Modified
                header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
                return true;
            }
        }
        
        // Set response headers for future conditional requests
        header('ETag: ' . $etag);
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
        header('Cache-Control: public, max-age=60');
        
        return false;
    }
}

/**
 * Convenience function for caching responses
 */
function cache_response(string $endpoint, callable $callback, ?int $ttl = null): array {
    return ResponseCache::getInstance()->cacheGet($endpoint, $_GET ?: [], $callback, $ttl);
}

/**
 * Convenience function for invalidating cache
 */
function invalidate_cache(string $endpoint, ?array $params = null): bool {
    return ResponseCache::getInstance()->invalidate($endpoint, $params);
}

/**
 * Convenience function for responding with cache
 */
function respond_with_cache(string $endpoint, callable $callback, ?int $ttl = null): void {
    ResponseCache::getInstance()->respondWithCache($endpoint, $callback, $ttl);
}