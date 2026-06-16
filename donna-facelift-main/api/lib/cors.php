<?php
/**
 * CORS Security Helper
 * Implements environment-specific origin allowlisting
 * Part of WS1 Phase 1 Security Fixes
 */

class CORSHelper {
    private static $allowedOrigins = null;
    
    /**
     * Get allowed origins from environment or defaults
     */
    private static function getAllowedOrigins() {
        if (self::$allowedOrigins !== null) {
            return self::$allowedOrigins;
        }
        
        // Check environment variable for allowed origins
        $originsEnv = getenv('ALLOWED_ORIGINS');
        if ($originsEnv) {
            self::$allowedOrigins = array_map('trim', explode(',', $originsEnv));
        } else {
            // Default allowed origins for development
            self::$allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://donna-interactive.vercel.app',
                'https://donna.yourdomain.com'
            ];
            
            // Add production domain if configured
            $productionDomain = getenv('PRODUCTION_DOMAIN');
            if ($productionDomain) {
                self::$allowedOrigins[] = 'https://' . $productionDomain;
            }
        }
        
        return self::$allowedOrigins;
    }
    
    /**
     * Validate if an origin is allowed
     */
    public static function isOriginAllowed($origin) {
        if (empty($origin)) {
            return false;
        }
        
        $allowedOrigins = self::getAllowedOrigins();
        return in_array($origin, $allowedOrigins, true);
    }
    
    /**
     * Set CORS headers based on request origin
     * Returns true if origin is allowed, false otherwise
     */
    public static function handleCORS() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Handle OPTIONS preflight
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (self::isOriginAllowed($origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
                header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
                header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Max-Age: 86400'); // 24 hours
                http_response_code(204);
            } else {
                http_response_code(403);
            }
            exit(0);
        }
        
        // Set CORS headers for allowed origins
        if (self::isOriginAllowed($origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin'); // Important for caching
            return true;
        }
        
        // Origin not allowed
        return false;
    }
    
    /**
     * Enforce CORS - blocks request if origin not allowed
     */
    public static function enforceCORS() {
        if (!self::handleCORS()) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'CORS policy violation: Origin not allowed'
            ]);
            exit;
        }
    }
    
    /**
     * Get CORS status for debugging
     */
    public static function getCORSStatus() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? 'No origin header';
        return [
            'request_origin' => $origin,
            'allowed_origins' => self::getAllowedOrigins(),
            'is_allowed' => self::isOriginAllowed($origin),
            'method' => $_SERVER['REQUEST_METHOD']
        ];
    }
}