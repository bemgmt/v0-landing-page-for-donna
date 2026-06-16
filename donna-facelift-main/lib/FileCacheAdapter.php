<?php
/**
 * File-based Cache Adapter
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Phase 5 Task 5.1: File-based caching implementation
 */

require_once __DIR__ . '/CacheManager.php';

class FileCacheAdapter implements CacheAdapterInterface {
    
    private $cacheDir;
    private $defaultPermissions = 0644;
    
    public function __construct(?string $cacheDir = null) {
        $this->cacheDir = $cacheDir ?: $this->getDefaultCacheDir();
        $this->ensureCacheDirectory();
    }
    
    public function get(string $key): mixed {
        $filePath = $this->getFilePath($key);
        
        if (!file_exists($filePath)) {
            return null;
        }
        
        $content = file_get_contents($filePath);
        if ($content === false) {
            return null;
        }
        
        $data = unserialize($content);
        if ($data === false) {
            // Invalid data, remove the file
            unlink($filePath);
            return null;
        }
        
        // Check if expired
        if (isset($data['expires_at']) && $data['expires_at'] < time()) {
            unlink($filePath);
            return null;
        }
        
        return $data['value'];
    }
    
    public function set(string $key, mixed $value, int $ttl): bool {
        $filePath = $this->getFilePath($key);
        $expiresAt = time() + $ttl;
        
        $data = [
            'value' => $value,
            'created_at' => time(),
            'expires_at' => $expiresAt,
            'ttl' => $ttl
        ];
        
        $serialized = serialize($data);
        $result = file_put_contents($filePath, $serialized, LOCK_EX);
        
        if ($result !== false) {
            chmod($filePath, $this->defaultPermissions);
            return true;
        }
        
        return false;
    }
    
    public function delete(string $key): bool {
        $filePath = $this->getFilePath($key);
        
        if (file_exists($filePath)) {
            return unlink($filePath);
        }
        
        return true; // Already deleted
    }
    
    public function clear(): bool {
        $files = glob($this->cacheDir . '/*.cache');
        $success = true;
        
        foreach ($files as $file) {
            if (!unlink($file)) {
                $success = false;
            }
        }
        
        return $success;
    }
    
    public function deletePattern(string $pattern): int {
        $deleted = 0;
        $files = glob($this->cacheDir . '/*.cache');
        
        foreach ($files as $file) {
            $key = $this->getKeyFromFilePath($file);
            if (fnmatch($pattern, $key)) {
                if (unlink($file)) {
                    $deleted++;
                }
            }
        }
        
        return $deleted;
    }
    
    /**
     * Clean up expired cache files
     */
    public function cleanup(): int {
        $cleaned = 0;
        $files = glob($this->cacheDir . '/*.cache');
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            if ($content === false) {
                continue;
            }
            
            $data = unserialize($content);
            if ($data === false) {
                // Invalid data, remove the file
                unlink($file);
                $cleaned++;
                continue;
            }
            
            // Check if expired
            if (isset($data['expires_at']) && $data['expires_at'] < time()) {
                unlink($file);
                $cleaned++;
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Get cache statistics
     */
    public function getStats(): array {
        $files = glob($this->cacheDir . '/*.cache');
        $totalSize = 0;
        $expiredCount = 0;
        $validCount = 0;
        
        foreach ($files as $file) {
            $totalSize += filesize($file);
            
            $content = file_get_contents($file);
            if ($content === false) {
                continue;
            }
            
            $data = unserialize($content);
            if ($data === false) {
                continue;
            }
            
            if (isset($data['expires_at']) && $data['expires_at'] < time()) {
                $expiredCount++;
            } else {
                $validCount++;
            }
        }
        
        return [
            'adapter' => 'file',
            'cache_directory' => $this->cacheDir,
            'total_files' => count($files),
            'valid_files' => $validCount,
            'expired_files' => $expiredCount,
            'total_size_bytes' => $totalSize,
            'total_size_mb' => round($totalSize / 1024 / 1024, 2)
        ];
    }
    
    private function getDefaultCacheDir(): string {
        $baseDir = getenv('CACHE_DIR') ?: __DIR__ . '/../cache';
        return rtrim($baseDir, '/');
    }
    
    private function ensureCacheDirectory(): void {
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
        
        if (!is_writable($this->cacheDir)) {
            throw new Exception("Cache directory is not writable: {$this->cacheDir}");
        }
    }
    
    private function getFilePath(string $key): string {
        $safeKey = $this->sanitizeKey($key);
        return $this->cacheDir . '/' . $safeKey . '.cache';
    }
    
    private function getKeyFromFilePath(string $filePath): string {
        $filename = basename($filePath, '.cache');
        return $filename; // Note: This is the sanitized key, not the original
    }
    
    private function sanitizeKey(string $key): string {
        // Replace unsafe characters with safe ones
        $safe = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $key);
        
        // Limit length to avoid filesystem issues
        if (strlen($safe) > 200) {
            $safe = substr($safe, 0, 150) . '_' . md5($key);
        }
        
        return $safe;
    }
}

/**
 * APCu Cache Adapter (if APCu is available)
 */
class APCuCacheAdapter implements CacheAdapterInterface {
    
    private $prefix;
    
    public function __construct(string $prefix = 'donna_cache_') {
        if (!extension_loaded('apcu') || !apcu_enabled()) {
            throw new Exception('APCu extension is not available or enabled');
        }
        
        $this->prefix = $prefix;
    }
    
    public function get(string $key): mixed {
        $success = false;
        $value = apcu_fetch($this->prefix . $key, $success);
        return $success ? $value : null;
    }
    
    public function set(string $key, mixed $value, int $ttl): bool {
        return apcu_store($this->prefix . $key, $value, $ttl);
    }
    
    public function delete(string $key): bool {
        return apcu_delete($this->prefix . $key);
    }
    
    public function clear(): bool {
        // Clear only our prefixed keys
        $info = apcu_cache_info();
        $deleted = 0;
        
        if (isset($info['cache_list'])) {
            foreach ($info['cache_list'] as $entry) {
                if (strpos($entry['info'], $this->prefix) === 0) {
                    apcu_delete($entry['info']);
                    $deleted++;
                }
            }
        }
        
        return $deleted > 0;
    }
    
    public function deletePattern(string $pattern): int {
        $info = apcu_cache_info();
        $deleted = 0;
        
        if (isset($info['cache_list'])) {
            foreach ($info['cache_list'] as $entry) {
                $key = $entry['info'];
                if (strpos($key, $this->prefix) === 0) {
                    $unprefixedKey = substr($key, strlen($this->prefix));
                    if (fnmatch($pattern, $unprefixedKey)) {
                        apcu_delete($key);
                        $deleted++;
                    }
                }
            }
        }
        
        return $deleted;
    }
    
    public function getStats(): array {
        $info = apcu_cache_info();
        
        return [
            'adapter' => 'apcu',
            'prefix' => $this->prefix,
            'memory_size' => $info['memory_type'] ?? 'unknown',
            'cache_entries' => $info['num_entries'] ?? 0,
            'hits' => $info['num_hits'] ?? 0,
            'misses' => $info['num_misses'] ?? 0,
            'start_time' => $info['start_time'] ?? 0,
            'expunges' => $info['expunges'] ?? 0
        ];
    }
}

/**
 * Redis Cache Adapter (basic implementation)
 */
class RedisCacheAdapter implements CacheAdapterInterface {
    
    private $redis;
    private $prefix;
    
    public function __construct(?string $host = null, ?int $port = null, string $prefix = 'donna_cache:') {
        if (!extension_loaded('redis')) {
            throw new Exception('Redis extension is not available');
        }
        
        $this->redis = new Redis();
        $host = $host ?: getenv('REDIS_HOST') ?: 'localhost';
        $port = $port ?: (int)(getenv('REDIS_PORT') ?: 6379);
        
        if (!$this->redis->connect($host, $port)) {
            throw new Exception("Could not connect to Redis at {$host}:{$port}");
        }
        
        $this->prefix = $prefix;
    }
    
    public function get(string $key): mixed {
        $value = $this->redis->get($this->prefix . $key);
        return $value !== false ? unserialize($value) : null;
    }
    
    public function set(string $key, mixed $value, int $ttl): bool {
        $serialized = serialize($value);
        return $this->redis->setex($this->prefix . $key, $ttl, $serialized);
    }
    
    public function delete(string $key): bool {
        return $this->redis->del($this->prefix . $key) > 0;
    }
    
    public function clear(): bool {
        $keys = $this->redis->keys($this->prefix . '*');
        if (empty($keys)) {
            return true;
        }
        
        return $this->redis->del($keys) > 0;
    }
    
    public function deletePattern(string $pattern): int {
        $keys = $this->redis->keys($this->prefix . $pattern);
        if (empty($keys)) {
            return 0;
        }
        
        return $this->redis->del($keys);
    }
    
    public function getStats(): array {
        $info = $this->redis->info();
        
        return [
            'adapter' => 'redis',
            'prefix' => $this->prefix,
            'connected_clients' => $info['connected_clients'] ?? 0,
            'used_memory' => $info['used_memory'] ?? 0,
            'used_memory_human' => $info['used_memory_human'] ?? '0B',
            'keyspace_hits' => $info['keyspace_hits'] ?? 0,
            'keyspace_misses' => $info['keyspace_misses'] ?? 0,
            'uptime_in_seconds' => $info['uptime_in_seconds'] ?? 0
        ];
    }
}
