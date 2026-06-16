<?php
/**
 * Response Cache for API Endpoints
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Phase 5 Task 5.1: Response caching for idempotent endpoints
 */

require_once __DIR__ . '/CacheManager.php';
require_once __DIR__ . '/FileCacheAdapter.php';
require_once __DIR__ . '/logging_helpers.php';

class ResponseCache {
    
    private $cache;
    private $config;
    
    public function __construct(?CacheManager $cache = null) {
        $this->cache = $cache ?: new CacheManager();
        $this->config = $this->loadConfig();
    }
    
    /**
     * Cache a response for an idempotent endpoint
     */
    public function cacheEndpoint(string $endpoint, array $params = [], ?int $ttl = null): mixed {
        // Check if endpoint is cacheable
        if (!$this->isCacheable($endpoint)) {
            return $this->executeEndpoint($endpoint, $params);
        }
        
        $cacheKey = $this->generateCacheKey($endpoint, $params);
        $ttl = $ttl ?? $this->getTtlForEndpoint($endpoint);
        
        return $this->cache->remember($cacheKey, function() use ($endpoint, $params) {
            return $this->executeEndpoint($endpoint, $params);
        }, $ttl);
    }
    
    /**
     * Execute endpoint and return response
     */
    private function executeEndpoint(string $endpoint, array $params): mixed {
        $startTime = microtime(true);
        
        try {
            $response = $this->callEndpoint($endpoint, $params);
            
            $duration = microtime(true) - $startTime;
            log_info('Endpoint executed', [
                'endpoint' => $endpoint,
                'duration_ms' => round($duration * 1000, 2),
                'cached' => false
            ]);
            
            return $response;
            
        } catch (Exception $e) {
            log_error('Endpoint execution failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
                'params' => $params
            ]);
            throw $e;
        }
    }
    
    /**
     * Call the actual endpoint
     */
    private function callEndpoint(string $endpoint, array $params): mixed {
        switch ($endpoint) {
            case 'health':
                return $this->healthEndpoint();
                
            case 'user_profile':
                return $this->userProfileEndpoint($params);
                
            case 'chat_history':
                return $this->chatHistoryEndpoint($params);
                
            case 'system_stats':
                return $this->systemStatsEndpoint($params);
                
            case 'conversation_export':
                return $this->conversationExportEndpoint($params);
                
            default:
                throw new Exception("Unknown endpoint: {$endpoint}");
        }
    }
    
    /**
     * Health check endpoint (highly cacheable)
     */
    private function healthEndpoint(): array {
        return [
            'status' => 'healthy',
            'timestamp' => time(),
            'version' => getenv('APP_VERSION') ?: 'v1',
            'cache_enabled' => $this->cache->healthCheck()['status'] === 'healthy'
        ];
    }
    
    /**
     * User profile endpoint (moderately cacheable)
     */
    private function userProfileEndpoint(array $params): array {
        $userId = $params['user_id'] ?? null;
        if (!$userId) {
            throw new Exception('User ID required');
        }
        
        // Simulate user profile retrieval
        return [
            'user_id' => $userId,
            'profile' => [
                'name' => 'User ' . substr($userId, 0, 8),
                'preferences' => ['theme' => 'light'],
                'last_active' => date('c')
            ],
            'cached_at' => date('c')
        ];
    }
    
    /**
     * Chat history endpoint (cacheable with shorter TTL)
     */
    private function chatHistoryEndpoint(array $params): array {
        $chatId = $params['chat_id'] ?? null;
        $limit = $params['limit'] ?? 20;
        
        if (!$chatId) {
            throw new Exception('Chat ID required');
        }
        
        // Simulate chat history retrieval
        return [
            'chat_id' => $chatId,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => 'Hello',
                    'timestamp' => date('c', time() - 3600)
                ],
                [
                    'role' => 'assistant',
                    'content' => 'Hi there!',
                    'timestamp' => date('c', time() - 3500)
                ]
            ],
            'total_count' => 2,
            'cached_at' => date('c')
        ];
    }
    
    /**
     * System statistics endpoint (moderately cacheable)
     */
    private function systemStatsEndpoint(array $params): array {
        $period = $params['period'] ?? 'day';
        
        return [
            'period' => $period,
            'stats' => [
                'active_users' => rand(50, 200),
                'total_sessions' => rand(100, 500),
                'total_messages' => rand(1000, 5000),
                'cache_hit_rate' => $this->cache->getMetrics()['hit_rate_percent'] ?? 0
            ],
            'cached_at' => date('c')
        ];
    }
    
    /**
     * Conversation export endpoint (highly cacheable)
     */
    private function conversationExportEndpoint(array $params): array {
        $userId = $params['user_id'] ?? null;
        $format = $params['format'] ?? 'json';
        
        if (!$userId) {
            throw new Exception('User ID required');
        }
        
        return [
            'user_id' => $userId,
            'format' => $format,
            'export_url' => "/exports/{$userId}_{$format}_" . time() . ".{$format}",
            'expires_at' => date('c', time() + 3600),
            'cached_at' => date('c')
        ];
    }
    
    /**
     * Check if endpoint is cacheable
     */
    private function isCacheable(string $endpoint): bool {
        return in_array($endpoint, $this->config['cacheable_endpoints']);
    }
    
    /**
     * Get TTL for specific endpoint
     */
    private function getTtlForEndpoint(string $endpoint): int {
        return $this->config['endpoint_ttls'][$endpoint] ?? $this->config['default_ttl'];
    }
    
    /**
     * Generate cache key for endpoint and parameters
     */
    private function generateCacheKey(string $endpoint, array $params): string {
        // Remove sensitive parameters
        $filteredParams = $this->filterSensitiveParams($params);
        
        // Sort parameters for consistent keys
        ksort($filteredParams);
        
        $keyData = [
            'endpoint' => $endpoint,
            'params' => $filteredParams,
            'version' => $this->config['cache_version']
        ];
        
        return 'response:' . md5(serialize($keyData));
    }
    
    /**
     * Filter out sensitive parameters from cache key
     */
    private function filterSensitiveParams(array $params): array {
        $sensitiveKeys = ['password', 'token', 'api_key', 'secret', 'auth'];
        
        return array_filter($params, function($key) use ($sensitiveKeys) {
            foreach ($sensitiveKeys as $sensitive) {
                if (stripos($key, $sensitive) !== false) {
                    return false;
                }
            }
            return true;
        }, ARRAY_FILTER_USE_KEY);
    }
    
    /**
     * Invalidate cache for specific endpoint
     */
    public function invalidateEndpoint(string $endpoint, array $params = []): bool {
        $cacheKey = $this->generateCacheKey($endpoint, $params);
        return $this->cache->delete($cacheKey);
    }
    
    /**
     * Invalidate cache by pattern
     */
    public function invalidatePattern(string $pattern): int {
        return $this->cache->invalidatePattern($pattern);
    }
    
    /**
     * Get cache metrics
     */
    public function getMetrics(): array {
        $cacheMetrics = $this->cache->getMetrics();
        
        return [
            'cache_metrics' => $cacheMetrics,
            'endpoint_config' => [
                'cacheable_endpoints' => $this->config['cacheable_endpoints'],
                'default_ttl' => $this->config['default_ttl'],
                'cache_version' => $this->config['cache_version']
            ],
            'cache_health' => $this->cache->healthCheck()
        ];
    }
    
    /**
     * Warm up cache for common endpoints
     */
    public function warmUp(array $endpoints = []): array {
        $results = [];
        $endpointsToWarm = $endpoints ?: $this->config['warmup_endpoints'];
        
        foreach ($endpointsToWarm as $endpoint => $paramsList) {
            foreach ($paramsList as $params) {
                try {
                    $startTime = microtime(true);
                    $this->cacheEndpoint($endpoint, $params);
                    $duration = microtime(true) - $startTime;
                    
                    $results[] = [
                        'endpoint' => $endpoint,
                        'params' => $params,
                        'success' => true,
                        'duration_ms' => round($duration * 1000, 2)
                    ];
                    
                } catch (Exception $e) {
                    $results[] = [
                        'endpoint' => $endpoint,
                        'params' => $params,
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }
        }
        
        return $results;
    }
    
    /**
     * Load cache configuration
     */
    private function loadConfig(): array {
        return [
            'cacheable_endpoints' => [
                'health',
                'user_profile',
                'chat_history',
                'system_stats',
                'conversation_export'
            ],
            'endpoint_ttls' => [
                'health' => 300,           // 5 minutes
                'user_profile' => 600,     // 10 minutes
                'chat_history' => 180,     // 3 minutes
                'system_stats' => 300,     // 5 minutes
                'conversation_export' => 3600  // 1 hour
            ],
            'default_ttl' => 300,
            'cache_version' => '1.0',
            'warmup_endpoints' => [
                'health' => [[]],
                'system_stats' => [
                    ['period' => 'day'],
                    ['period' => 'week']
                ]
            ]
        ];
    }
}
