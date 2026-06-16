<?php
/**
 * ApiResponder - Standardized API response helper
 * 
 * Provides consistent JSON response format across all PHP endpoints:
 * Success: { success: true, data: any, traceId?: string }
 * Error: { success: false, error: string, traceId?: string }
 */

class ApiResponder {
    private static $traceId = null;

    /**
     * Initialize trace ID for request correlation
     */
    public static function initTraceId($traceId = null) {
        self::$traceId = $traceId ?: 'trace_' . uniqid() . '_' . substr(md5(microtime()), 0, 8);
        return self::$traceId;
    }

    /**
     * Get current trace ID
     */
    public static function getTraceId() {
        return self::$traceId ?: self::initTraceId();
    }

    /**
     * Send standardized success response
     */
    public static function jsonSuccess($data = null, $message = null, $statusCode = 200) {
        self::setSecurityHeaders();
        http_response_code($statusCode);
        
        $response = [
            'success' => true,
            'traceId' => self::getTraceId()
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if ($message !== null) {
            $response['message'] = $message;
        }
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send standardized error response
     */
    public static function jsonError($error, $statusCode = 400, $errorCode = null) {
        self::setSecurityHeaders();
        http_response_code($statusCode);
        
        $response = [
            'success' => false,
            'error' => $error,
            'traceId' => self::getTraceId()
        ];
        
        if ($errorCode !== null) {
            $response['errorCode'] = $errorCode;
        }
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send validation error response
     */
    public static function jsonValidationError($errors, $message = 'Validation failed') {
        self::setSecurityHeaders();
        http_response_code(422);
        
        $response = [
            'success' => false,
            'error' => $message,
            'errorCode' => 'VALIDATION_ERROR',
            'validationErrors' => $errors,
            'traceId' => self::getTraceId()
        ];
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send authentication error response
     */
    public static function jsonAuthError($message = 'Authentication required') {
        self::setSecurityHeaders();
        http_response_code(401);
        
        $response = [
            'success' => false,
            'error' => $message,
            'errorCode' => 'AUTH_ERROR',
            'traceId' => self::getTraceId()
        ];
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send authorization error response
     */
    public static function jsonForbiddenError($message = 'Access forbidden') {
        self::setSecurityHeaders();
        http_response_code(403);
        
        $response = [
            'success' => false,
            'error' => $message,
            'errorCode' => 'FORBIDDEN_ERROR',
            'traceId' => self::getTraceId()
        ];
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send not found error response
     */
    public static function jsonNotFoundError($message = 'Resource not found') {
        self::setSecurityHeaders();
        http_response_code(404);
        
        $response = [
            'success' => false,
            'error' => $message,
            'errorCode' => 'NOT_FOUND_ERROR',
            'traceId' => self::getTraceId()
        ];
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send server error response
     */
    public static function jsonServerError($message = 'Internal server error') {
        self::setSecurityHeaders();
        http_response_code(500);
        
        $response = [
            'success' => false,
            'error' => $message,
            'errorCode' => 'SERVER_ERROR',
            'traceId' => self::getTraceId()
        ];
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Set security headers for all responses
     */
    private static function setSecurityHeaders() {
        // CORS headers (will be overridden by Next.js middleware in dev)
        $allowedOrigins = explode(',', $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000');
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Credentials: true");
        }
        
        // Security headers
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        
        // Trace ID header for debugging
        if (self::$traceId) {
            header('X-Trace-ID: ' . self::$traceId);
        }
    }

    /**
     * Validate required fields in request data
     */
    public static function validateRequired($data, $requiredFields) {
        $errors = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                $errors[$field] = "Field '$field' is required";
            }
        }
        
        if (!empty($errors)) {
            self::jsonValidationError($errors);
        }
    }

    /**
     * Sanitize output to prevent XSS
     */
    public static function sanitizeOutput($data) {
        if (is_string($data)) {
            return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        }
        
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeOutput'], $data);
        }
        
        if (is_object($data)) {
            $sanitized = new stdClass();
            foreach ($data as $key => $value) {
                $sanitized->$key = self::sanitizeOutput($value);
            }
            return $sanitized;
        }
        
        return $data;
    }

    /**
     * Return success response as array for ResponseCache integration
     */
    public static function asArraySuccess($data, $message = null) {
        return [
            'success' => true,
            'data' => self::sanitizeOutput($data),
            'message' => $message,
            'traceId' => self::getTraceId()
        ];
    }

    /**
     * Return error response as array for ResponseCache integration
     */
    public static function asArrayError($error, $statusCode = 400) {
        return [
            'success' => false,
            'error' => $error,
            'errorCode' => $statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
            'traceId' => self::getTraceId()
        ];
    }
}
?>
