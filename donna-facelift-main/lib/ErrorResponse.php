<?php
/**
 * Standardized Error Response Handler
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Implements uniform error shape for client responses with trace IDs
 * Ensures no sensitive information is exposed to clients
 */

require_once __DIR__ . '/logging_helpers.php';
require_once __DIR__ . '/ApiResponder.php';

class ErrorResponse {
    // Standard error codes
    const ERROR_CODES = [
        'VALIDATION_ERROR' => 'Invalid input provided',
        'AUTHENTICATION_ERROR' => 'Authentication required',
        'AUTHORIZATION_ERROR' => 'Insufficient permissions',
        'NOT_FOUND' => 'Resource not found',
        'RATE_LIMIT_EXCEEDED' => 'Too many requests',
        'API_ERROR' => 'External service error',
        'SYSTEM_ERROR' => 'Internal system error',
        'CONFIGURATION_ERROR' => 'System configuration error',
        'ABUSE_DETECTED' => 'Content policy violation',
        'MAINTENANCE_MODE' => 'System temporarily unavailable'
    ];
    
    /**
     * Create a standardized error response
     */
    public static function create($errorCode, $customMessage = null, $context = [], $httpStatus = 400) {
        // Validate error code
        if (!array_key_exists($errorCode, self::ERROR_CODES)) {
            $errorCode = 'SYSTEM_ERROR';
        }
        
        // Generate trace ID and log the error
        $traceId = log_error("Client error response generated", [
            'error_code' => $errorCode,
            'http_status' => $httpStatus,
            'context' => $context,
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
        // Use custom message or default
        $message = $customMessage ?: self::ERROR_CODES[$errorCode];
        
        // Create standardized response (backward compatible + new fields)
        $response = [
            'ok' => false,
            'success' => false,
            'error' => $errorCode,
            'message' => $message,
            'ref' => $traceId,           // legacy reference field
            'traceId' => $traceId        // new standardized traceId field
        ];

        // Set HTTP status code
        http_response_code($httpStatus);
        
        return $response;
    }
    
    /**
     * Send a standardized error response and exit
     */
    public static function send($errorCode, $customMessage = null, $context = [], $httpStatus = 400) {
        $response = self::create($errorCode, $customMessage, $context, $httpStatus);
        
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
    
    /**
     * Handle validation errors
     */
    public static function validation($field, $issue, $context = []) {
        $message = "Validation failed for field '{$field}': {$issue}";
        return self::create('VALIDATION_ERROR', $message, $context, 400);
    }
    
    /**
     * Handle authentication errors
     */
    public static function authentication($message = null, $context = []) {
        return self::create('AUTHENTICATION_ERROR', $message, $context, 401);
    }
    
    /**
     * Handle authorization errors
     */
    public static function authorization($message = null, $context = []) {
        return self::create('AUTHORIZATION_ERROR', $message, $context, 403);
    }
    
    /**
     * Handle not found errors
     */
    public static function notFound($resource = null, $context = []) {
        $message = $resource ? "Resource '{$resource}' not found" : null;
        return self::create('NOT_FOUND', $message, $context, 404);
    }
    
    /**
     * Handle rate limiting errors
     */
    public static function rateLimit($retryAfter = null, $context = []) {
        $message = $retryAfter ? "Rate limit exceeded. Retry after {$retryAfter} seconds" : null;
        $response = self::create('RATE_LIMIT_EXCEEDED', $message, $context, 429);
        
        if ($retryAfter) {
            header("Retry-After: {$retryAfter}");
        }
        
        return $response;
    }
    
    /**
     * Handle external API errors
     */
    public static function apiError($service = null, $context = []) {
        $message = $service ? "External service '{$service}' is currently unavailable" : null;
        return self::create('API_ERROR', $message, $context, 502);
    }
    
    /**
     * Handle system errors
     */
    public static function systemError($context = []) {
        return self::create('SYSTEM_ERROR', null, $context, 500);
    }
    
    /**
     * Handle configuration errors
     */
    public static function configurationError($component = null, $context = []) {
        $message = $component ? "Configuration error in '{$component}'" : null;
        return self::create('CONFIGURATION_ERROR', $message, $context, 500);
    }
    
    /**
     * Handle abuse detection
     */
    public static function abuseDetected($context = []) {
        return self::create('ABUSE_DETECTED', null, $context, 400);
    }
    
    /**
     * Handle maintenance mode
     */
    public static function maintenanceMode($estimatedTime = null, $context = []) {
        $message = $estimatedTime ? "System maintenance in progress. Estimated completion: {$estimatedTime}" : null;
        $response = self::create('MAINTENANCE_MODE', $message, $context, 503);
        
        if ($estimatedTime) {
            header("Retry-After: 3600"); // Default 1 hour
        }
        
        return $response;
    }
    
    /**
     * Wrap an exception into a standardized error response
     */
    public static function fromException(Exception $e, $context = []) {
        // Log the full exception details securely
        $traceId = log_error("Exception caught", [
            'exception_class' => get_class($e),
            'exception_message' => $e->getMessage(),
            'exception_file' => $e->getFile(),
            'exception_line' => $e->getLine(),
            'exception_trace' => $e->getTraceAsString(),
            'context' => $context
        ]);
        
        // Determine error type based on exception
        $errorCode = 'SYSTEM_ERROR';
        $httpStatus = 500;
        
        if ($e instanceof InvalidArgumentException) {
            $errorCode = 'VALIDATION_ERROR';
            $httpStatus = 400;
        } elseif ($e instanceof UnauthorizedAccessException) {
            $errorCode = 'AUTHENTICATION_ERROR';
            $httpStatus = 401;
        } elseif ($e instanceof ForbiddenException) {
            $errorCode = 'AUTHORIZATION_ERROR';
            $httpStatus = 403;
        } elseif ($e instanceof NotFoundException) {
            $errorCode = 'NOT_FOUND';
            $httpStatus = 404;
        }
        
        // Create response with trace ID from logging
        $response = [
            'ok' => false,
            'error' => $errorCode,
            'message' => self::ERROR_CODES[$errorCode],
            'ref' => $traceId
        ];
        
        http_response_code($httpStatus);
        return $response;
    }
    
    /**
     * Create a success response (for consistency)
     */
    public static function success($data = null, $message = null) {
        // Include both legacy and new standardized fields
        $traceId = ApiResponder::getTraceId();
        $response = [
            'ok' => true,
            'success' => true,
            'traceId' => $traceId
        ];

        if ($message) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return $response;
    }

    /**
     * Validate that a response follows the standard format
     */
    public static function validate($response) {
        if (!is_array($response)) {
            return false;
        }
        
        // Must have 'ok' field
        if (!isset($response['ok']) || !is_bool($response['ok'])) {
            return false;
        }
        
        // Error responses must have error code and message
        if (!$response['ok']) {
            if (!isset($response['error']) || !isset($response['message'])) {
                return false;
            }
        }
        
        return true;
    }
}

/**
 * Convenience functions for common error responses
 */

function error_response($errorCode, $customMessage = null, $context = [], $httpStatus = 400) {
    return ErrorResponse::create($errorCode, $customMessage, $context, $httpStatus);
}

function send_error($errorCode, $customMessage = null, $context = [], $httpStatus = 400) {
    ErrorResponse::send($errorCode, $customMessage, $context, $httpStatus);
}

function success_response($data = null, $message = null) {
    return ErrorResponse::success($data, $message);
}

function send_success($data = null, $message = null) {
    header('Content-Type: application/json');
    echo json_encode(ErrorResponse::success($data, $message));
    exit;
}
