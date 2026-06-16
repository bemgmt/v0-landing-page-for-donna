<?php
/**
 * Rate Limiter for PHP Endpoints
 * Part of WS1 Phase 1 Security Fixes
 * Implements per-IP and per-endpoint rate limiting
 */

require_once __DIR__ . '/env-validator.php';

class RateLimiter {
    private static $instance = null;
    private $storageDir;
    private $enabled;
    private $defaultLimit;
    private $defaultWindow;
    
    // Default rate limits per endpoint (requests per minute)
    private static $endpointLimits = [
        'donna_logic' => 30,      // Main chat endpoint
        'marketing' => 20,         // Marketing endpoint
        'sales/overview' => 20,    // Sales dashboard
        'secretary/dashboard' => 20, // Secretary dashboard
        'conversations' => 50,     // Conversation history
        'chatbot_settings' => 10,  // Settings updates
        'voice-chat' => 20,        // Voice interactions
        'health' => 100,           // Health checks
        'test-marketing' => 5,     // Test endpoint
        'realtime-websocket' => 10 // WebSocket connections
    ];
    
    private function __construct() {
        // Check if rate limiting is enabled
        $this->enabled = EnvValidator::getBool('ENABLE_PHP_RATE_LIMITING', true);
        
        // Get configuration from environment
        $this->defaultLimit = EnvValidator::getInt('RATE_LIMIT_MAX_REQUESTS', 60);
        $this->defaultWindow = EnvValidator::getInt('RATE_LIMIT_WINDOW', 60); // seconds
        
        // Set up storage directory
        $this->setupStorageDir();
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Set up storage directory for rate limit data
     */
    private function setupStorageDir() {
        // Try to use APCu first
        if (extension_loaded('apcu') && ini_get('apc.enabled')) {
            $this->storageDir = null; // Use APCu
            return;
        }
        
        // Fallback to file-based storage
        $baseDir = dirname(__DIR__, 2); // Go up to project root
        $this->storageDir = $baseDir . '/data/rate_limits';
        
        // Create directory if it doesn't exist
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0755, true);
            
            // Add .htaccess to prevent direct access
            $htaccess = $this->storageDir . '/.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, "Deny from all\n");
            }
        }
    }
    
    /**
     * Check if request should be rate limited
     */
    public function checkLimit($endpoint = null, $identifier = null) {
        if (!$this->enabled) {
            return true; // Allow all requests if disabled
        }
        
        // Get identifier (IP address or user ID)
        if ($identifier === null) {
            $identifier = $this->getClientIdentifier();
        }
        
        // Get endpoint from script name if not provided
        if ($endpoint === null) {
            $endpoint = $this->getCurrentEndpoint();
        }
        
        // Get limit for this endpoint
        $limit = self::$endpointLimits[$endpoint] ?? $this->defaultLimit;
        $window = $this->defaultWindow;
        
        // Check if limit exceeded
        $key = $this->generateKey($identifier, $endpoint);
        $count = $this->getRequestCount($key);
        
        if ($count >= $limit) {
            $this->logRateLimitExceeded($identifier, $endpoint, $count, $limit);
            return false;
        }
        
        // Increment counter
        $this->incrementRequestCount($key, $window);
        
        return true;
    }
    
    /**
     * Enforce rate limit (blocks request if exceeded)
     */
    public function enforceLimit($endpoint = null, $identifier = null) {
        if (!$this->checkLimit($endpoint, $identifier)) {
            $this->sendRateLimitResponse();
        }
    }
    
    /**
     * Get client identifier (IP address)
     */
    private function getClientIdentifier() {
        // Get real IP address considering proxies
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        
        // Check for forwarded IP (be careful with these headers)
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($ips[0]);
        } elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = $_SERVER['HTTP_X_REAL_IP'];
        }
        
        // Validate IP address
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            $ip = '0.0.0.0';
        }
        
        // Hash IP for privacy (optional)
        return hash('sha256', $ip . (EnvValidator::get('RATE_LIMIT_SALT', 'default-salt')));
    }
    
    /**
     * Get current endpoint from script name
     */
    private function getCurrentEndpoint() {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $endpoint = basename($script, '.php');
        
        // Handle subdirectories
        if (strpos($script, '/sales/') !== false) {
            $endpoint = 'sales/' . $endpoint;
        } elseif (strpos($script, '/secretary/') !== false) {
            $endpoint = 'secretary/' . $endpoint;
        }
        
        return $endpoint;
    }
    
    /**
     * Generate storage key
     */
    private function generateKey($identifier, $endpoint) {
        return 'rate_limit:' . $identifier . ':' . $endpoint;
    }
    
    /**
     * Get request count from storage
     */
    private function getRequestCount($key) {
        // Try APCu first
        if ($this->storageDir === null) {
            $data = apcu_fetch($key);
            return $data === false ? 0 : intval($data);
        }
        
        // File-based storage
        $file = $this->storageDir . '/' . md5($key) . '.txt';
        
        if (!file_exists($file)) {
            return 0;
        }
        
        // Check if file is expired
        $mtime = filemtime($file);
        if (time() - $mtime > $this->defaultWindow) {
            @unlink($file);
            return 0;
        }
        
        // Read count with file locking
        $fp = @fopen($file, 'r');
        if (!$fp) {
            return 0;
        }
        
        if (flock($fp, LOCK_SH)) {
            $count = intval(fread($fp, 100));
            flock($fp, LOCK_UN);
        } else {
            $count = 0;
        }
        
        fclose($fp);
        return $count;
    }
    
    /**
     * Increment request count in storage
     */
    private function incrementRequestCount($key, $ttl) {
        // Try APCu first
        if ($this->storageDir === null) {
            $count = apcu_fetch($key);
            if ($count === false) {
                apcu_store($key, 1, $ttl);
            } else {
                apcu_inc($key);
            }
            return;
        }
        
        // File-based storage
        $file = $this->storageDir . '/' . md5($key) . '.txt';
        
        // Use file locking to prevent race conditions
        $fp = @fopen($file, 'c');
        if (!$fp) {
            return;
        }
        
        if (flock($fp, LOCK_EX)) {
            // Check if file is expired
            clearstatcache(true, $file);
            $size = filesize($file);
            
            if ($size > 0) {
                $mtime = filemtime($file);
                if (time() - $mtime > $ttl) {
                    // Expired, reset to 1
                    ftruncate($fp, 0);
                    rewind($fp);
                    fwrite($fp, '1');
                } else {
                    // Increment existing count
                    rewind($fp);
                    $count = intval(fread($fp, 100));
                    ftruncate($fp, 0);
                    rewind($fp);
                    fwrite($fp, strval($count + 1));
                }
            } else {
                // New file
                fwrite($fp, '1');
            }
            
            flock($fp, LOCK_UN);
        }
        
        fclose($fp);
    }
    
    /**
     * Send rate limit exceeded response
     */
    private function sendRateLimitResponse() {
        http_response_code(429);
        header('Content-Type: application/json');
        header('Retry-After: ' . $this->defaultWindow);
        header('X-RateLimit-Limit: ' . $this->defaultLimit);
        header('X-RateLimit-Remaining: 0');
        header('X-RateLimit-Reset: ' . (time() + $this->defaultWindow));
        
        echo json_encode([
            'success' => false,
            'error' => 'rate_limited',
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => $this->defaultWindow
        ]);
        
        exit;
    }
    
    /**
     * Log rate limit exceeded event
     */
    private function logRateLimitExceeded($identifier, $endpoint, $count, $limit) {
        // Log without exposing actual IP
        error_log(sprintf(
            'Rate limit exceeded: endpoint=%s, count=%d, limit=%d, identifier=%s',
            $endpoint,
            $count,
            $limit,
            substr($identifier, 0, 8) . '...' // Only log partial hash
        ));
    }
    
    /**
     * Clean up expired rate limit files (maintenance)
     */
    public function cleanup() {
        if ($this->storageDir === null || !is_dir($this->storageDir)) {
            return;
        }
        
        $now = time();
        $files = glob($this->storageDir . '/*.txt');
        
        foreach ($files as $file) {
            if ($now - filemtime($file) > $this->defaultWindow) {
                @unlink($file);
            }
        }
    }
    
    /**
     * Get rate limit status for debugging
     */
    public function getStatus($endpoint = null, $identifier = null) {
        if (!$this->enabled) {
            return ['enabled' => false];
        }
        
        if ($identifier === null) {
            $identifier = $this->getClientIdentifier();
        }
        
        if ($endpoint === null) {
            $endpoint = $this->getCurrentEndpoint();
        }
        
        $key = $this->generateKey($identifier, $endpoint);
        $count = $this->getRequestCount($key);
        $limit = self::$endpointLimits[$endpoint] ?? $this->defaultLimit;
        
        return [
            'enabled' => true,
            'endpoint' => $endpoint,
            'count' => $count,
            'limit' => $limit,
            'remaining' => max(0, $limit - $count),
            'window' => $this->defaultWindow,
            'reset' => time() + $this->defaultWindow
        ];
    }
}

// Note: Rate limiting must be explicitly enforced by calling:
// require_once __DIR__ . '/lib/rate-limiter.php';
// RateLimiter::getInstance()->enforceLimit('endpoint_name');