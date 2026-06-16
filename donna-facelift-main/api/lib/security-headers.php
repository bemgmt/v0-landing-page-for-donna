<?php
/**
 * Security Headers for PHP Endpoints
 * Part of WS1 Phase 7 Security Fixes
 * Implements security headers to protect against common web vulnerabilities
 */

class SecurityHeaders {
    private static $instance = null;
    private $enabled;
    private $cspReportOnly;
    private $cspReportUri;
    
    private function __construct() {
        // Check if security headers are enabled
        $this->enabled = $this->getEnvBool('ENABLE_PHP_SECURITY_HEADERS', true);
        $this->cspReportOnly = $this->getEnvBool('CSP_REPORT_ONLY', true);
        $this->cspReportUri = $this->getEnv('CSP_REPORT_URI', '');
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
     * Apply all security headers
     */
    public function apply() {
        if (!$this->enabled) {
            return;
        }
        
        // Prevent MIME type sniffing
        $this->setXContentTypeOptions();
        
        // Prevent clickjacking
        $this->setXFrameOptions();
        
        // Control referrer information
        $this->setReferrerPolicy();
        
        // Set permissions policy
        $this->setPermissionsPolicy();
        
        // Set Content Security Policy
        $this->setContentSecurityPolicy();
        
        // Additional security headers
        $this->setAdditionalHeaders();
    }
    
    /**
     * Set X-Content-Type-Options header
     * Prevents MIME type sniffing
     */
    private function setXContentTypeOptions() {
        header('X-Content-Type-Options: nosniff');
    }
    
    /**
     * Set X-Frame-Options header
     * Prevents clickjacking attacks
     */
    private function setXFrameOptions() {
        $frameOptions = $this->getEnv('X_FRAME_OPTIONS', 'DENY');
        header("X-Frame-Options: $frameOptions");
    }
    
    /**
     * Set Referrer-Policy header
     * Controls how much referrer information is sent
     */
    private function setReferrerPolicy() {
        $referrerPolicy = $this->getEnv('REFERRER_POLICY', 'strict-origin-when-cross-origin');
        header("Referrer-Policy: $referrerPolicy");
    }
    
    /**
     * Set Permissions-Policy header (formerly Feature-Policy)
     * Controls which features can be used
     */
    private function setPermissionsPolicy() {
        // Default restrictive policy
        $defaultPolicy = [
            'accelerometer' => '()',
            'ambient-light-sensor' => '()',
            'autoplay' => '(self)',
            'battery' => '()',
            'camera' => '()',
            'display-capture' => '()',
            'document-domain' => '()',
            'encrypted-media' => '()',
            'execution-while-not-rendered' => '()',
            'execution-while-out-of-viewport' => '()',
            'fullscreen' => '(self)',
            'gamepad' => '()',
            'geolocation' => '()',
            'gyroscope' => '()',
            'layout-animations' => '(self)',
            'legacy-image-formats' => '(self)',
            'magnetometer' => '()',
            'microphone' => '()',  // Deny by default, voice features use WebRTC
            'midi' => '()',
            'navigation-override' => '()',
            'oversized-images' => '(self)',
            'payment' => '()',
            'picture-in-picture' => '()',
            'publickey-credentials-get' => '()',
            'speaker-selection' => '()',
            'sync-xhr' => '(self)',
            'unoptimized-images' => '(self)',
            'unsized-media' => '(self)',
            'usb' => '()',
            'vibrate' => '()',
            'vr' => '()',
            'wake-lock' => '()',
            'xr-spatial-tracking' => '()'
        ];
        
        // Build policy string
        $policyParts = [];
        foreach ($defaultPolicy as $feature => $value) {
            $policyParts[] = "$feature=$value";
        }
        
        // Allow overriding via environment
        $customPolicy = $this->getEnv('PERMISSIONS_POLICY', '');
        if (!empty($customPolicy)) {
            header("Permissions-Policy: $customPolicy");
        } else {
            header('Permissions-Policy: ' . implode(', ', $policyParts));
        }
    }
    
    /**
     * Set Content-Security-Policy header
     * Protects against XSS and injection attacks
     */
    private function setContentSecurityPolicy() {
        // Get allowed origins for CSP
        $allowedOrigins = $this->getEnv('ALLOWED_ORIGINS', 'http://localhost:3000');
        $origins = array_map('trim', explode(',', $allowedOrigins));
        
        // Build CSP directives
        $csp = [
            "default-src 'self' " . implode(' ', $origins),
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https:",
            "media-src 'self' blob:",
            "connect-src 'self' " . implode(' ', $origins) . " wss: https://api.openai.com https://api.elevenlabs.io",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ];
        
        // Add report URI if configured
        if (!empty($this->cspReportUri)) {
            $csp[] = "report-uri " . $this->cspReportUri;
        }
        
        $cspString = implode('; ', $csp);
        
        // Apply CSP header (report-only mode by default)
        if ($this->cspReportOnly) {
            header("Content-Security-Policy-Report-Only: $cspString");
        } else {
            header("Content-Security-Policy: $cspString");
        }
    }
    
    /**
     * Set additional security headers
     */
    private function setAdditionalHeaders() {
        // Prevent IE from executing downloads in site context
        header('X-Download-Options: noopen');
        
        // DNS prefetch control
        header('X-DNS-Prefetch-Control: off');
        
        // Strict Transport Security (only if HTTPS)
        if ($this->isHttps()) {
            $maxAge = $this->getEnv('HSTS_MAX_AGE', '31536000'); // 1 year
            header("Strict-Transport-Security: max-age=$maxAge; includeSubDomains; preload");
        }
        
        // X-Permitted-Cross-Domain-Policies for Adobe products
        header('X-Permitted-Cross-Domain-Policies: none');
        
        // Expect-CT for Certificate Transparency
        if ($this->isHttps()) {
            $expectCT = $this->getEnv('EXPECT_CT', '');
            if (!empty($expectCT)) {
                header("Expect-CT: $expectCT");
            }
        }
    }
    
    /**
     * Check if request is over HTTPS
     */
    private function isHttps() {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || $_SERVER['SERVER_PORT'] == 443
            || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    }
    
    /**
     * Get environment variable with fallback
     */
    private function getEnv($key, $default = '') {
        $value = getenv($key);
        if ($value === false) {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
        }
        return $value;
    }
    
    /**
     * Get boolean environment variable
     */
    private function getEnvBool($key, $default = false) {
        $value = $this->getEnv($key, $default ? 'true' : 'false');
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
    
    /**
     * Apply security headers (static helper)
     */
    public static function applyHeaders() {
        self::getInstance()->apply();
    }
    
    /**
     * Get current security headers for debugging
     */
    public function getHeaders() {
        $headers = [];
        
        if (!$this->enabled) {
            return ['enabled' => false];
        }
        
        // Simulate what headers would be set
        $headers['X-Content-Type-Options'] = 'nosniff';
        $headers['X-Frame-Options'] = $this->getEnv('X_FRAME_OPTIONS', 'DENY');
        $headers['Referrer-Policy'] = $this->getEnv('REFERRER_POLICY', 'strict-origin-when-cross-origin');
        $headers['X-Download-Options'] = 'noopen';
        $headers['X-DNS-Prefetch-Control'] = 'off';
        $headers['X-Permitted-Cross-Domain-Policies'] = 'none';
        
        if ($this->isHttps()) {
            $headers['Strict-Transport-Security'] = 'max-age=' . $this->getEnv('HSTS_MAX_AGE', '31536000') . '; includeSubDomains; preload';
        }
        
        return [
            'enabled' => true,
            'headers' => $headers,
            'csp_report_only' => $this->cspReportOnly
        ];
    }
}

// Auto-apply headers when included (can be disabled via environment)
if (!defined('SKIP_AUTO_SECURITY_HEADERS')) {
    SecurityHeaders::applyHeaders();
}