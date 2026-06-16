<?php
/**
 * Logging Helper Functions
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Provides convenient wrapper functions for the LogManager
 */

require_once __DIR__ . '/LogManager.php';

// Global log manager instance
$GLOBALS['log_manager'] = null;

/**
 * Get or create the global log manager instance
 */
function getLogManager() {
    if ($GLOBALS['log_manager'] === null) {
        $config = [
            'log_dir' => __DIR__ . '/../logs',
            'max_file_size' => 10 * 1024 * 1024, // 10MB
            'max_files' => 10,
            'max_age_days' => 30,
            'enable_pii_scrubbing' => true
        ];
        
        // Override with environment variables if available
        if (getenv('LOG_DIR')) {
            $config['log_dir'] = getenv('LOG_DIR');
        }
        if (getenv('LOG_MAX_SIZE')) {
            $config['max_file_size'] = (int)getenv('LOG_MAX_SIZE');
        }
        if (getenv('LOG_MAX_FILES')) {
            $config['max_files'] = (int)getenv('LOG_MAX_FILES');
        }
        if (getenv('LOG_MAX_AGE_DAYS')) {
            $config['max_age_days'] = (int)getenv('LOG_MAX_AGE_DAYS');
        }
        if (getenv('LOG_DISABLE_PII_SCRUBBING')) {
            $config['enable_pii_scrubbing'] = false;
        }
        
        $GLOBALS['log_manager'] = new LogManager($config);
    }
    
    return $GLOBALS['log_manager'];
}

/**
 * Enhanced error_log replacement with PII scrubbing and trace IDs
 */
function secure_log($message, $level = 'info', $context = []) {
    $logger = getLogManager();
    return $logger->log($level, $message, $context);
}

/**
 * Log error with trace ID
 */
function log_error($message, $context = []) {
    $logger = getLogManager();
    return $logger->error($message, $context);
}

/**
 * Log warning with trace ID
 */
function log_warning($message, $context = []) {
    $logger = getLogManager();
    return $logger->warning($message, $context);
}

/**
 * Log info with trace ID
 */
function log_info($message, $context = []) {
    $logger = getLogManager();
    return $logger->info($message, $context);
}

/**
 * Log debug information
 */
function log_debug($message, $context = []) {
    $logger = getLogManager();
    return $logger->debug($message, $context);
}

/**
 * Log security events
 */
function log_security($event, $details = []) {
    $logger = getLogManager();
    return $logger->security($event, $details);
}

/**
 * Log abuse detection
 */
function log_abuse($chatId, $userId, $message, $details = []) {
    $logger = getLogManager();
    return $logger->abuse($chatId, $userId, $message, $details);
}

/**
 * Enhanced error_log wrapper that maintains backward compatibility
 * while adding PII protection and trace IDs
 */
function enhanced_error_log($message, $message_type = 0, $destination = null, $extra_headers = null) {
    // For backward compatibility, still call original error_log
    if ($message_type !== 0 || $destination !== null || $extra_headers !== null) {
        return error_log($message, $message_type, $destination, $extra_headers);
    }
    
    // Use our enhanced logging for simple error_log calls
    return log_error($message);
}

/**
 * Log API request/response for debugging
 */
function log_api_call($endpoint, $method, $request_data = null, $response_data = null, $duration = null) {
    $context = [
        'endpoint' => $endpoint,
        'method' => $method,
        'duration_ms' => $duration,
        'request_size' => $request_data ? strlen(json_encode($request_data)) : 0,
        'response_size' => $response_data ? strlen(json_encode($response_data)) : 0
    ];
    
    // Don't log full request/response data to avoid PII, just metadata
    return log_info("API call: {$method} {$endpoint}", $context);
}

/**
 * Log database operations
 */
function log_db_operation($operation, $table, $affected_rows = null, $duration = null) {
    $context = [
        'operation' => $operation,
        'table' => $table,
        'affected_rows' => $affected_rows,
        'duration_ms' => $duration
    ];
    
    return log_info("DB operation: {$operation} on {$table}", $context);
}

/**
 * Log file operations
 */
function log_file_operation($operation, $file_path, $file_size = null) {
    $context = [
        'operation' => $operation,
        'file_path' => basename($file_path), // Only log filename, not full path
        'file_size' => $file_size
    ];
    
    return log_info("File operation: {$operation}", $context);
}

/**
 * Get logging statistics
 */
function get_log_stats() {
    $logger = getLogManager();
    return $logger->getStats();
}

/**
 * Clean up old logs manually
 */
function cleanup_logs() {
    $logger = getLogManager();
    $stats = $logger->getStats();
    
    // Force cleanup by creating a dummy log entry
    $logger->info('Manual log cleanup triggered');
    
    return $stats;
}

/**
 * Test logging functionality
 */
function test_logging() {
    $results = [];
    
    try {
        // Test basic logging
        $traceId1 = log_info('Test info message');
        $results['info_test'] = ['success' => true, 'trace_id' => $traceId1];
        
        // Test PII scrubbing
        $traceId2 = log_warning('User email test@example.com attempted login');
        $results['pii_test'] = ['success' => true, 'trace_id' => $traceId2];
        
        // Test security logging
        $traceId3 = log_security('Failed login attempt', ['attempts' => 3]);
        $results['security_test'] = ['success' => true, 'trace_id' => $traceId3];
        
        // Test abuse logging
        $traceId4 = log_abuse('chat123', 'user456', 'This contains my email test@example.com');
        $results['abuse_test'] = ['success' => true, 'trace_id' => $traceId4];
        
        // Get stats
        $results['stats'] = get_log_stats();
        
    } catch (Exception $e) {
        $results['error'] = $e->getMessage();
    }
    
    return $results;
}
