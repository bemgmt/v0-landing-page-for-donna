<?php
/**
 * Centralized Logging Manager with Rotation and PII Protection
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Implements:
 * - Log rotation by size and time
 * - PII scrubbing and obfuscation
 * - Trace ID correlation
 * - Structured logging format
 */

class LogManager {
    private $logDir;
    private $maxFileSize;
    private $maxFiles;
    private $maxAge;
    private $enablePiiScrubbing;
    
    // PII patterns for scrubbing
    private $piiPatterns = [
        'email' => '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/',
        'phone' => '/\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/',
        'ssn' => '/\b\d{3}-?\d{2}-?\d{4}\b/',
        'credit_card' => '/\b(?:\d{4}[-\s]?){3}\d{4}\b/',
        'api_key' => '/\b[A-Za-z0-9]{32,}\b/',
        'token' => '/\b(sk-|pk_|rk_)[A-Za-z0-9_-]+\b/'
    ];
    
    public function __construct($config = []) {
        $this->logDir = $config['log_dir'] ?? __DIR__ . '/../logs';
        $this->maxFileSize = $config['max_file_size'] ?? 10 * 1024 * 1024; // 10MB
        $this->maxFiles = $config['max_files'] ?? 10;
        $this->maxAge = $config['max_age_days'] ?? 30;
        $this->enablePiiScrubbing = $config['enable_pii_scrubbing'] ?? true;
        
        // Ensure log directory exists with secure permissions
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }
    
    /**
     * Log a message with specified level and context
     */
    public function log($level, $message, $context = []) {
        $traceId = $this->generateTraceId();
        
        $logEntry = [
            'timestamp' => date('c'),
            'level' => strtoupper($level),
            'message' => $this->enablePiiScrubbing ? $this->scrubPii($message) : $message,
            'trace_id' => $traceId,
            'context' => $this->scrubContext($context),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        $logFile = $this->getLogFile($level);
        $this->writeLogEntry($logFile, $logEntry);
        $this->rotateIfNeeded($logFile);
        
        return $traceId;
    }
    
    /**
     * Convenience methods for different log levels
     */
    public function error($message, $context = []) {
        return $this->log('error', $message, $context);
    }
    
    public function warning($message, $context = []) {
        return $this->log('warning', $message, $context);
    }
    
    public function info($message, $context = []) {
        return $this->log('info', $message, $context);
    }
    
    public function debug($message, $context = []) {
        return $this->log('debug', $message, $context);
    }
    
    /**
     * Log security events with enhanced context
     */
    public function security($event, $details = []) {
        $context = array_merge($details, [
            'event_type' => 'security',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? 'unknown'
        ]);
        
        return $this->log('security', $event, $context);
    }
    
    /**
     * Log abuse detection events
     */
    public function abuse($chatId, $userId, $message, $details = []) {
        $context = array_merge($details, [
            'event_type' => 'abuse',
            'chat_id' => $chatId,
            'user_id' => $userId,
            'message_preview' => substr($this->scrubPii($message), 0, 100)
        ]);
        
        return $this->log('abuse', 'Abuse detected', $context);
    }
    
    /**
     * Generate a unique trace ID for correlation
     */
    private function generateTraceId() {
        return 'trace_' . uniqid() . '_' . bin2hex(random_bytes(4));
    }
    
    /**
     * Scrub PII from message content
     */
    private function scrubPii($message) {
        if (!$this->enablePiiScrubbing) {
            return $message;
        }
        
        $scrubbed = $message;
        
        foreach ($this->piiPatterns as $type => $pattern) {
            $scrubbed = preg_replace_callback($pattern, function($matches) use ($type) {
                switch ($type) {
                    case 'email':
                        $parts = explode('@', $matches[0]);
                        return substr($parts[0], 0, 2) . '***@' . $parts[1];
                    case 'phone':
                        return '***-***-' . substr($matches[0], -4);
                    case 'api_key':
                    case 'token':
                        return substr($matches[0], 0, 8) . '***';
                    default:
                        return '[' . strtoupper($type) . '_REDACTED]';
                }
            }, $scrubbed);
        }
        
        return $scrubbed;
    }
    
    /**
     * Scrub PII from context array
     */
    private function scrubContext($context) {
        if (!$this->enablePiiScrubbing || !is_array($context)) {
            return $context;
        }
        
        $scrubbed = [];
        foreach ($context as $key => $value) {
            if (is_string($value)) {
                $scrubbed[$key] = $this->scrubPii($value);
            } elseif (is_array($value)) {
                $scrubbed[$key] = $this->scrubContext($value);
            } else {
                $scrubbed[$key] = $value;
            }
        }
        
        return $scrubbed;
    }
    
    /**
     * Get log file path for specified level
     */
    private function getLogFile($level) {
        return $this->logDir . '/' . strtolower($level) . '.log';
    }
    
    /**
     * Write log entry to file
     */
    private function writeLogEntry($logFile, $logEntry) {
        $logLine = json_encode($logEntry) . "\n";
        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
        
        // Set secure file permissions
        if (file_exists($logFile)) {
            chmod($logFile, 0640);
        }
    }
    
    /**
     * Check if log rotation is needed and perform it
     */
    private function rotateIfNeeded($logFile) {
        if (!file_exists($logFile)) {
            return;
        }
        
        // Check file size
        if (filesize($logFile) > $this->maxFileSize) {
            $this->rotateLogFile($logFile);
        }
        
        // Clean up old files
        $this->cleanupOldLogs($logFile);
    }
    
    /**
     * Rotate a log file
     */
    private function rotateLogFile($logFile) {
        $timestamp = date('Y-m-d_H-i-s');
        $rotatedFile = $logFile . '.' . $timestamp;
        
        // Move current log to rotated file
        rename($logFile, $rotatedFile);
        
        // Compress rotated file if gzip is available
        if (function_exists('gzencode')) {
            $content = file_get_contents($rotatedFile);
            $compressed = gzencode($content);
            file_put_contents($rotatedFile . '.gz', $compressed);
            unlink($rotatedFile);
        }
    }
    
    /**
     * Clean up old log files based on age and count
     */
    private function cleanupOldLogs($logFile) {
        $logDir = dirname($logFile);
        $baseName = basename($logFile);
        $pattern = $logDir . '/' . $baseName . '.*';
        
        $files = glob($pattern);
        if (!$files) {
            return;
        }
        
        // Sort by modification time (oldest first)
        usort($files, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        $cutoffTime = time() - ($this->maxAge * 24 * 60 * 60);
        
        foreach ($files as $file) {
            // Remove files older than max age
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                continue;
            }
            
            // Remove excess files beyond max count
            if (count($files) > $this->maxFiles) {
                unlink($file);
                array_shift($files);
            }
        }
    }
    
    /**
     * Get log statistics
     */
    public function getStats() {
        $stats = [
            'log_dir' => $this->logDir,
            'total_size' => 0,
            'file_count' => 0,
            'files' => []
        ];
        
        if (!is_dir($this->logDir)) {
            return $stats;
        }
        
        $files = glob($this->logDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                $size = filesize($file);
                $stats['total_size'] += $size;
                $stats['file_count']++;
                $stats['files'][] = [
                    'name' => basename($file),
                    'size' => $size,
                    'modified' => filemtime($file)
                ];
            }
        }
        
        return $stats;
    }
}
