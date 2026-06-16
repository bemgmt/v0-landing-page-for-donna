<?php
/**
 * Environment Variable Validator for PHP
 * Part of WS1 Phase 1 Security Fixes
 * Validates required environment variables at startup
 */

class EnvValidator {
    private static $instance = null;
    private $validated = false;
    private $errors = [];
    private $warnings = [];
    
    // Required environment variables
    private static $required = [
        'OPENAI_API_KEY',
        'ALLOWED_ORIGINS'
    ];
    
    // Optional environment variables
    private static $optional = [
        'ELEVENLABS_API_KEY',
        'ELEVENLABS_VOICE_ID',
        'JWT_SECRET',
        'SESSION_SECRET',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'PRODUCTION_DOMAIN',
        'ENABLE_WS_PROXY',
        'RATE_LIMIT_WINDOW',
        'RATE_LIMIT_MAX_REQUESTS'
    ];
    
    // Variables that can be missing in development
    private static $developmentOptional = [
        'JWT_SECRET',
        'SESSION_SECRET'
    ];
    
    private function __construct() {}
    
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
     * Validate environment variables
     */
    public function validate() {
        if ($this->validated) {
            return true;
        }
        
        $isDevelopment = $this->isDevelopment();
        
        // Check required variables
        foreach (self::$required as $envVar) {
            $value = getenv($envVar);
            if (empty($value)) {
                // Allow some flexibility in development
                if ($isDevelopment && in_array($envVar, self::$developmentOptional)) {
                    $this->warnings[] = "⚠️  {$envVar} is missing (optional in development)";
                } else {
                    $this->errors[] = "❌ {$envVar} is required but not set";
                }
            }
        }
        
        // Check optional variables
        foreach (self::$optional as $envVar) {
            $value = getenv($envVar);
            if (empty($value)) {
                $this->warnings[] = "ℹ️  {$envVar} is optional but not set";
            }
        }
        
        // Log warnings to error log (not to client)
        if (!empty($this->warnings)) {
            error_log("Environment Variable Warnings:");
            foreach ($this->warnings as $warning) {
                error_log($warning);
            }
        }
        
        // Handle errors
        if (!empty($this->errors)) {
            error_log("\n🚨 Environment Variable Validation Failed!");
            error_log("The following required environment variables are missing:");
            foreach ($this->errors as $error) {
                error_log($error);
            }
            error_log("Please set these variables in your .env file.");
            error_log("See .env.example for reference.\n");
            
            // Allow bypass in development with warning
            if ($isDevelopment && getenv('SKIP_ENV_VALIDATION') === 'true') {
                error_log("⚠️  SKIP_ENV_VALIDATION is set - proceeding with missing variables");
                error_log("⚠️  This is dangerous and should only be used for debugging");
            } else {
                // Don't expose internal errors to client
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Server configuration error. Please contact administrator.'
                ]);
                exit(1);
            }
        }
        
        $this->validated = true;
        error_log("✅ Environment variables validated successfully");
        return true;
    }
    
    /**
     * Get environment variable with default
     */
    public static function get($key, $default = '') {
        $value = getenv($key);
        return $value !== false ? $value : $default;
    }
    
    /**
     * Check if environment variable exists
     */
    public static function has($key) {
        return getenv($key) !== false && getenv($key) !== '';
    }
    
    /**
     * Get integer environment variable
     */
    public static function getInt($key, $default = 0) {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }
        $parsed = intval($value);
        return $parsed !== 0 || $value === '0' ? $parsed : $default;
    }
    
    /**
     * Get boolean environment variable
     */
    public static function getBool($key, $default = false) {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }
        return strtolower($value) === 'true' || $value === '1';
    }
    
    /**
     * Get array from comma-separated environment variable
     */
    public static function getArray($key, $default = []) {
        $value = getenv($key);
        if ($value === false || $value === '') {
            return $default;
        }
        return array_map('trim', explode(',', $value));
    }
    
    /**
     * Check if running in development mode
     */
    private function isDevelopment() {
        $env = getenv('APP_ENV') ?: getenv('ENVIRONMENT');
        return $env === 'development' || $env === 'dev' || $env === 'local';
    }
    
    /**
     * Get validation errors (for debugging only)
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Get validation warnings (for debugging only)
     */
    public function getWarnings() {
        return $this->warnings;
    }
}

// Auto-validate on include
EnvValidator::getInstance()->validate();