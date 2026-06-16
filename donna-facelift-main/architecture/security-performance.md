# Security & Performance Considerations

## Overview

This document outlines the comprehensive security measures and performance optimizations implemented in the DONNA platform. The architecture prioritizes data protection, system reliability, and optimal user experience while maintaining scalability and maintainability.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DONNA SECURITY LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION SECURITY                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Input Validation│ │ Authentication  │ │ Authorization   │   │
│  │ (XSS, CSRF)     │ │ (API Keys)      │ │ (Role-based)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  DATA SECURITY                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Encryption      │ │ Data Privacy    │ │ Secure Storage  │   │
│  │ (TLS/SSL)       │ │ (GDPR)          │ │ (File System)   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE SECURITY                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Network Security│ │ Server Security │ │ Monitoring      │   │
│  │ (Firewall)      │ │ (Updates)       │ │ (Logging)       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Security Measures

### 1. API Security

**API Key Management**:
```php
// Secure API key storage and validation
class APIKeyManager {
    private $validKeys = [];
    
    public function validateKey($apiKey) {
        // Validate against stored keys
        if (!in_array($apiKey, $this->validKeys)) {
            throw new UnauthorizedException('Invalid API key');
        }
        
        // Log API key usage
        $this->logAPIUsage($apiKey);
        
        return true;
    }
    
    private function logAPIUsage($apiKey) {
        $logEntry = [
            'timestamp' => date('c'),
            'api_key' => substr($apiKey, 0, 8) . '...', // Partial key for logging
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        file_put_contents(
            __DIR__ . '/../logs/api_usage.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
}
```

**Rate Limiting**:
```php
// Rate limiting implementation
class RateLimiter {
    private $limits = [
        'openai' => ['requests' => 60, 'window' => 60], // 60 requests per minute
        'elevenlabs' => ['requests' => 100, 'window' => 60], // 100 requests per minute
        'gmail' => ['requests' => 1000, 'window' => 100] // 1000 requests per 100 seconds
    ];
    
    public function checkLimit($service, $userId = null) {
        $key = $userId ? "{$service}:{$userId}" : $service;
        $limit = $this->limits[$service];
        
        $current = $this->getCurrentUsage($key);
        
        if ($current >= $limit['requests']) {
            throw new RateLimitExceededException('Rate limit exceeded');
        }
        
        $this->incrementUsage($key, $limit['window']);
        return true;
    }
    
    private function getCurrentUsage($key) {
        $cacheFile = __DIR__ . "/../cache/rate_limit_{$key}.json";
        
        if (!file_exists($cacheFile)) {
            return 0;
        }
        
        $data = json_decode(file_get_contents($cacheFile), true);
        $windowStart = time() - $data['window'];
        
        // Filter requests within the time window
        $requests = array_filter($data['requests'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        return count($requests);
    }
}
```

**Input Validation and Sanitization**:
```php
// Comprehensive input validation
class InputValidator {
    public function validateMessage($message) {
        // Check for required fields
        if (empty($message)) {
            throw new ValidationException('Message is required');
        }
        
        // Check message length
        if (strlen($message) > 4000) {
            throw new ValidationException('Message too long');
        }
        
        // Sanitize input
        $message = $this->sanitizeInput($message);
        
        // Check for malicious content
        if ($this->containsMaliciousContent($message)) {
            throw new SecurityException('Malicious content detected');
        }
        
        return $message;
    }
    
    private function sanitizeInput($input) {
        // Remove HTML tags
        $input = strip_tags($input);
        
        // Escape special characters
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        
        // Remove null bytes
        $input = str_replace("\0", '', $input);
        
        return trim($input);
    }
    
    private function containsMaliciousContent($input) {
        $maliciousPatterns = [
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<iframe\b[^>]*>/i',
            '/<object\b[^>]*>/i',
            '/<embed\b[^>]*>/i'
        ];
        
        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
}
```

### 2. Data Security

**Encryption in Transit**:
```php
// Ensure all communications use HTTPS
function enforceHTTPS() {
    if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
        $redirectURL = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        header("Location: $redirectURL", true, 301);
        exit();
    }
}

// Set security headers
function setSecurityHeaders() {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\';');
}
```

**Data Privacy Compliance**:
```php
// GDPR compliance measures
class DataPrivacyManager {
    public function anonymizeUserData($userId) {
        $userFile = __DIR__ . "/../data/memory/{$userId}.json";
        
        if (file_exists($userFile)) {
            $userData = json_decode(file_get_contents($userFile), true);
            
            // Anonymize personal data
            $userData['name'] = 'Anonymous User';
            $userData['email'] = 'anonymous@example.com';
            $userData['company'] = 'Anonymous Company';
            
            // Keep only essential data for system functionality
            $anonymizedData = [
                'preferences' => $userData['preferences'] ?? [],
                'interactions' => $userData['interactions'] ?? 0,
                'last_interaction' => $userData['last_interaction'] ?? null,
                'anonymized_at' => date('c')
            ];
            
            file_put_contents($userFile, json_encode($anonymizedData, JSON_PRETTY_PRINT));
        }
    }
    
    public function deleteUserData($userId) {
        // Delete user memory
        $userFile = __DIR__ . "/../data/memory/{$userId}.json";
        if (file_exists($userFile)) {
            unlink($userFile);
        }
        
        // Delete chat sessions
        $chatFiles = glob(__DIR__ . "/../data/chat_sessions/*{$userId}*.json");
        foreach ($chatFiles as $file) {
            unlink($file);
        }
        
        // Log deletion
        $this->logDataDeletion($userId);
    }
    
    private function logDataDeletion($userId) {
        $logEntry = [
            'timestamp' => date('c'),
            'action' => 'data_deletion',
            'user_id' => $userId,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        file_put_contents(
            __DIR__ . '/../logs/privacy.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
}
```

**Secure File Storage**:
```php
// Secure file handling
class SecureFileManager {
    private $allowedExtensions = ['json', 'log', 'txt'];
    private $maxFileSize = 1024 * 1024; // 1MB
    
    public function saveSecureFile($filename, $content, $directory) {
        // Validate filename
        if (!$this->isValidFilename($filename)) {
            throw new SecurityException('Invalid filename');
        }
        
        // Validate content
        if (strlen($content) > $this->maxFileSize) {
            throw new SecurityException('File too large');
        }
        
        // Sanitize content
        $content = $this->sanitizeFileContent($content);
        
        // Create secure file path
        $filePath = $this->createSecurePath($directory, $filename);
        
        // Write file with proper permissions
        file_put_contents($filePath, $content, LOCK_EX);
        chmod($filePath, 0644);
        
        return $filePath;
    }
    
    private function isValidFilename($filename) {
        // Check for directory traversal
        if (strpos($filename, '..') !== false) {
            return false;
        }
        
        // Check for allowed extensions
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        if (!in_array($extension, $this->allowedExtensions)) {
            return false;
        }
        
        // Check for dangerous characters
        if (preg_match('/[<>:"|?*]/', $filename)) {
            return false;
        }
        
        return true;
    }
    
    private function sanitizeFileContent($content) {
        // Remove null bytes
        $content = str_replace("\0", '', $content);
        
        // Validate JSON if applicable
        if (json_decode($content) === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new SecurityException('Invalid JSON content');
        }
        
        return $content;
    }
}
```

### 3. Authentication and Authorization

**API Authentication**:
```php
// JWT-based authentication (future implementation)
class JWTAuthenticator {
    private $secretKey;
    
    public function __construct($secretKey) {
        $this->secretKey = $secretKey;
    }
    
    public function generateToken($userId, $expiration = 3600) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $userId,
            'exp' => time() + $expiration,
            'iat' => time()
        ]);
        
        $headerEncoded = $this->base64UrlEncode($header);
        $payloadEncoded = $this->base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $this->secretKey, true);
        $signatureEncoded = $this->base64UrlEncode($signature);
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }
    
    public function validateToken($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new AuthenticationException('Invalid token format');
        }
        
        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
        
        $signature = $this->base64UrlDecode($signatureEncoded);
        $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $this->secretKey, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            throw new AuthenticationException('Invalid token signature');
        }
        
        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);
        
        if ($payload['exp'] < time()) {
            throw new AuthenticationException('Token expired');
        }
        
        return $payload;
    }
}
```

**Role-Based Access Control**:
```php
// Role-based authorization
class AuthorizationManager {
    private $roles = [
        'admin' => ['read', 'write', 'delete', 'manage'],
        'user' => ['read', 'write'],
        'guest' => ['read']
    ];
    
    public function checkPermission($userId, $action, $resource = null) {
        $userRole = $this->getUserRole($userId);
        
        if (!isset($this->roles[$userRole])) {
            throw new AuthorizationException('Invalid user role');
        }
        
        if (!in_array($action, $this->roles[$userRole])) {
            throw new AuthorizationException('Insufficient permissions');
        }
        
        // Additional resource-specific checks
        if ($resource && !$this->canAccessResource($userId, $resource)) {
            throw new AuthorizationException('Resource access denied');
        }
        
        return true;
    }
    
    private function getUserRole($userId) {
        // Get user role from database or session
        // For now, return default role
        return 'user';
    }
    
    private function canAccessResource($userId, $resource) {
        // Implement resource-specific access control
        return true;
    }
}
```

## Performance Optimization

### 1. Frontend Performance

**Code Splitting and Lazy Loading**:
```typescript
// Dynamic imports for code splitting
const SalesInterface = dynamic(() => import('./interfaces/sales-interface'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const EmailInterface = dynamic(() => import('./interfaces/email-interface'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

// Lazy loading for heavy components
const VoiceProvider = lazy(() => import('./voice/VoiceProvider'))
```

**Bundle Optimization**:
```javascript
// next.config.mjs - Bundle optimization
const nextConfig = {
  // Enable bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize CSS
  experimental: {
    optimizeCss: true,
  }
}
```

**State Management Optimization**:
```typescript
// Memoization for expensive calculations
const filteredContacts = useMemo(() => {
  return salesData?.contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []
}, [salesData?.contacts, searchTerm, statusFilter])

// Callback memoization
const handleContactUpdate = useCallback((contactId: string, updates: Partial<Contact>) => {
  setSalesData(prev => ({
    ...prev,
    contacts: prev.contacts.map(contact =>
      contact.id === contactId ? { ...contact, ...updates } : contact
    )
  }))
}, [])
```

**Virtual Scrolling for Large Lists**:
```typescript
// Virtual scrolling implementation
import { FixedSizeList as List } from 'react-window'

const VirtualizedContactList = ({ contacts }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ContactItem contact={contacts[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={contacts.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 2. Backend Performance

**Caching Strategy**:
```php
// Multi-level caching system
class CacheManager {
    private $cacheDir;
    private $defaultTTL = 300; // 5 minutes
    
    public function __construct($cacheDir) {
        $this->cacheDir = $cacheDir;
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
    }
    
    public function get($key) {
        $cacheFile = $this->getCacheFile($key);
        
        if (!file_exists($cacheFile)) {
            return null;
        }
        
        $data = json_decode(file_get_contents($cacheFile), true);
        
        if ($data['expires'] < time()) {
            unlink($cacheFile);
            return null;
        }
        
        return $data['value'];
    }
    
    public function set($key, $value, $ttl = null) {
        $ttl = $ttl ?? $this->defaultTTL;
        $cacheFile = $this->getCacheFile($key);
        
        $data = [
            'value' => $value,
            'expires' => time() + $ttl,
            'created' => time()
        ];
        
        file_put_contents($cacheFile, json_encode($data), LOCK_EX);
        chmod($cacheFile, 0644);
    }
    
    public function delete($key) {
        $cacheFile = $this->getCacheFile($key);
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }
    
    public function clear() {
        $files = glob($this->cacheDir . '/*.json');
        foreach ($files as $file) {
            unlink($file);
        }
    }
    
    private function getCacheFile($key) {
        $hash = hash('sha256', $key);
        return $this->cacheDir . '/' . $hash . '.json';
    }
}
```

**Database Query Optimization**:
```php
// Optimized data retrieval
class OptimizedDataManager {
    private $cache;
    
    public function __construct() {
        $this->cache = new CacheManager(__DIR__ . '/../cache');
    }
    
    public function getSalesData($userId) {
        $cacheKey = "sales_data_{$userId}";
        $cached = $this->cache->get($cacheKey);
        
        if ($cached !== null) {
            return $cached;
        }
        
        // Fetch from data source
        $data = $this->fetchSalesDataFromSource($userId);
        
        // Cache for 5 minutes
        $this->cache->set($cacheKey, $data, 300);
        
        return $data;
    }
    
    public function updateSalesData($userId, $updates) {
        // Update data source
        $this->updateSalesDataInSource($userId, $updates);
        
        // Invalidate cache
        $cacheKey = "sales_data_{$userId}";
        $this->cache->delete($cacheKey);
        
        // Pre-warm cache
        $this->getSalesData($userId);
    }
}
```

**Connection Pooling**:
```php
// HTTP connection pooling
class ConnectionPool {
    private $connections = [];
    private $maxConnections = 10;
    
    public function getConnection($url) {
        $key = parse_url($url, PHP_URL_HOST);
        
        if (!isset($this->connections[$key])) {
            $this->connections[$key] = [];
        }
        
        if (empty($this->connections[$key])) {
            return $this->createConnection($url);
        }
        
        return array_pop($this->connections[$key]);
    }
    
    public function returnConnection($url, $connection) {
        $key = parse_url($url, PHP_URL_HOST);
        
        if (count($this->connections[$key]) < $this->maxConnections) {
            $this->connections[$key][] = $connection;
        } else {
            curl_close($connection);
        }
    }
    
    private function createConnection($url) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
            CURLOPT_HTTPHEADER => [
                'Connection: keep-alive',
                'Keep-Alive: timeout=30, max=100'
            ]
        ]);
        
        return $ch;
    }
}
```

### 3. API Performance

**Response Compression**:
```php
// Enable gzip compression
function enableCompression() {
    if (extension_loaded('zlib') && !ob_get_level()) {
        ob_start('ob_gzhandler');
    }
}

// Compress API responses
function compressResponse($data) {
    $json = json_encode($data);
    
    if (strlen($json) > 1024) { // Only compress large responses
        $compressed = gzencode($json, 6);
        if ($compressed !== false) {
            header('Content-Encoding: gzip');
            return $compressed;
        }
    }
    
    return $json;
}
```

**Async Processing**:
```php
// Async task processing
class AsyncTaskManager {
    private $taskQueue = [];
    
    public function addTask($task, $priority = 0) {
        $this->taskQueue[] = [
            'task' => $task,
            'priority' => $priority,
            'created' => time()
        ];
        
        // Sort by priority
        usort($this->taskQueue, function($a, $b) {
            return $b['priority'] - $a['priority'];
        });
    }
    
    public function processTasks() {
        while (!empty($this->taskQueue)) {
            $task = array_shift($this->taskQueue);
            $this->executeTask($task['task']);
        }
    }
    
    private function executeTask($task) {
        // Execute task in background
        if (function_exists('pcntl_fork')) {
            $pid = pcntl_fork();
            if ($pid == 0) {
                // Child process
                $task();
                exit(0);
            }
        } else {
            // Fallback for Windows
            $task();
        }
    }
}
```

## Monitoring and Alerting

### 1. Performance Monitoring

**Application Performance Monitoring**:
```php
// Performance monitoring
class PerformanceMonitor {
    private $metrics = [];
    
    public function startTimer($operation) {
        $this->metrics[$operation] = [
            'start' => microtime(true),
            'memory_start' => memory_get_usage()
        ];
    }
    
    public function endTimer($operation) {
        if (!isset($this->metrics[$operation])) {
            return;
        }
        
        $this->metrics[$operation]['end'] = microtime(true);
        $this->metrics[$operation]['memory_end'] = memory_get_usage();
        $this->metrics[$operation]['duration'] = 
            $this->metrics[$operation]['end'] - $this->metrics[$operation]['start'];
        $this->metrics[$operation]['memory_used'] = 
            $this->metrics[$operation]['memory_end'] - $this->metrics[$operation]['memory_start'];
        
        // Log slow operations
        if ($this->metrics[$operation]['duration'] > 1.0) {
            $this->logSlowOperation($operation, $this->metrics[$operation]);
        }
    }
    
    private function logSlowOperation($operation, $metrics) {
        $logEntry = [
            'timestamp' => date('c'),
            'operation' => $operation,
            'duration' => $metrics['duration'],
            'memory_used' => $metrics['memory_used'],
            'type' => 'slow_operation'
        ];
        
        file_put_contents(
            __DIR__ . '/../logs/performance.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
}
```

**Real-time Performance Metrics**:
```typescript
// Frontend performance monitoring
class PerformanceTracker {
  private metrics: Map<string, number> = new Map()
  
  startTiming(operation: string) {
    this.metrics.set(operation, performance.now())
  }
  
  endTiming(operation: string) {
    const startTime = this.metrics.get(operation)
    if (startTime) {
      const duration = performance.now() - startTime
      this.logMetric(operation, duration)
      this.metrics.delete(operation)
    }
  }
  
  private logMetric(operation: string, duration: number) {
    // Send to analytics service
    if (duration > 1000) { // Log slow operations (>1s)
      console.warn(`Slow operation: ${operation} took ${duration}ms`)
    }
  }
}
```

### 2. Security Monitoring

**Intrusion Detection**:
```php
// Security monitoring and intrusion detection
class SecurityMonitor {
    private $suspiciousPatterns = [
        '/union.*select/i',
        '/drop.*table/i',
        '/insert.*into/i',
        '/delete.*from/i',
        '/script.*alert/i',
        '/<iframe/i',
        '/javascript:/i'
    ];
    
    public function monitorRequest($request) {
        $suspicious = false;
        $patterns = [];
        
        foreach ($this->suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $request)) {
                $suspicious = true;
                $patterns[] = $pattern;
            }
        }
        
        if ($suspicious) {
            $this->logSuspiciousActivity($request, $patterns);
            $this->takeSecurityAction();
        }
    }
    
    private function logSuspiciousActivity($request, $patterns) {
        $logEntry = [
            'timestamp' => date('c'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request' => substr($request, 0, 1000), // Limit log size
            'patterns' => $patterns,
            'type' => 'suspicious_activity'
        ];
        
        file_put_contents(
            __DIR__ . '/../logs/security.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
    
    private function takeSecurityAction() {
        // Implement security actions (rate limiting, IP blocking, etc.)
        $this->rateLimitIP($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    }
}
```

**Audit Logging**:
```php
// Comprehensive audit logging
class AuditLogger {
    public function logUserAction($userId, $action, $resource, $metadata = []) {
        $logEntry = [
            'timestamp' => date('c'),
            'user_id' => $userId,
            'action' => $action,
            'resource' => $resource,
            'metadata' => $metadata,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'session_id' => session_id()
        ];
        
        file_put_contents(
            __DIR__ . '/../logs/audit.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
    
    public function logDataAccess($userId, $dataType, $operation, $metadata = []) {
        $this->logUserAction($userId, $operation, $dataType, $metadata);
    }
    
    public function logSecurityEvent($event, $severity, $details = []) {
        $logEntry = [
            'timestamp' => date('c'),
            'event' => $event,
            'severity' => $severity,
            'details' => $details,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'type' => 'security_event'
        ];
        
        file_put_contents(
            __DIR__ . '/../logs/security.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
}
```

## Disaster Recovery

### 1. Backup Strategy

**Automated Backup System**:
```bash
#!/bin/bash
# Comprehensive backup script

BACKUP_DIR="/backups/donna"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/html/donna"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data files
tar -czf $BACKUP_DIR/data_$DATE.tar.gz -C $PROJECT_DIR data/

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C $PROJECT_DIR .env bootstrap_env.php

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C $PROJECT_DIR logs/

# Backup code (excluding node_modules and cache)
tar -czf $BACKUP_DIR/code_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='cache' \
    -C $PROJECT_DIR .

# Create backup manifest
cat > $BACKUP_DIR/manifest_$DATE.json << EOF
{
    "timestamp": "$(date -Iseconds)",
    "backup_id": "$DATE",
    "files": [
        "data_$DATE.tar.gz",
        "config_$DATE.tar.gz",
        "logs_$DATE.tar.gz",
        "code_$DATE.tar.gz"
    ],
    "size": "$(du -sh $BACKUP_DIR/*_$DATE.tar.gz | awk '{sum+=$1} END {print sum}')"
}
EOF

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "manifest_*.json" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 2. Recovery Procedures

**Data Recovery Process**:
```bash
#!/bin/bash
# Data recovery script

BACKUP_DIR="/backups/donna"
PROJECT_DIR="/var/www/html/donna"
BACKUP_ID=$1

if [ -z "$BACKUP_ID" ]; then
    echo "Usage: $0 <backup_id>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/manifest_*.json
    exit 1
fi

# Verify backup exists
if [ ! -f "$BACKUP_DIR/manifest_$BACKUP_ID.json" ]; then
    echo "Backup $BACKUP_ID not found"
    exit 1
fi

# Stop services
systemctl stop apache2
systemctl stop mysql

# Restore data
tar -xzf $BACKUP_DIR/data_$BACKUP_ID.tar.gz -C $PROJECT_DIR/
tar -xzf $BACKUP_DIR/config_$BACKUP_ID.tar.gz -C $PROJECT_DIR/
tar -xzf $BACKUP_DIR/logs_$BACKUP_ID.tar.gz -C $PROJECT_DIR/

# Set proper permissions
chown -R www-data:www-data $PROJECT_DIR/data/
chown -R www-data:www-data $PROJECT_DIR/logs/
chmod -R 755 $PROJECT_DIR/data/
chmod -R 755 $PROJECT_DIR/logs/

# Start services
systemctl start mysql
systemctl start apache2

echo "Recovery completed for backup: $BACKUP_ID"
```

---

*This comprehensive security and performance architecture ensures the DONNA platform operates securely, efficiently, and reliably while maintaining optimal user experience and system integrity.*

