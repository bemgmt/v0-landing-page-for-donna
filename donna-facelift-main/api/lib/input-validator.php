<?php
/**
 * Input Validation Helper for PHP
 * Part of WS1 Phase 1 Security Fixes
 * Provides comprehensive input validation and sanitization
 */

class InputValidator {
    
    // Maximum lengths for various fields
    const MAX_EMAIL_LENGTH = 254;
    const MAX_NAME_LENGTH = 100;
    const MAX_MESSAGE_LENGTH = 10000;
    const MAX_ID_LENGTH = 50;
    const MAX_PATH_COMPONENT_LENGTH = 255;
    const MAX_URL_LENGTH = 2048;
    
    // Patterns for validation
    const PATTERN_SAFE_ID = '/^[a-zA-Z0-9_-]+$/';
    const PATTERN_SAFE_PATH = '/^[a-zA-Z0-9_\-\.\/]+$/';
    const PATTERN_SAFE_NAME = '/^[a-zA-Z0-9\s\-\.\']+$/u';
    const PATTERN_PHONE = '/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/';
    
    /**
     * Validate and sanitize email address
     */
    public static function validateEmail($email, $required = false) {
        if (empty($email)) {
            return $required ? false : '';
        }
        
        $email = trim($email);
        
        // Check length
        if (strlen($email) > self::MAX_EMAIL_LENGTH) {
            return false;
        }
        
        // Use filter_var for email validation
        $validated = filter_var($email, FILTER_VALIDATE_EMAIL);
        if ($validated === false) {
            return false;
        }
        
        // Additional checks for common issues
        if (strpos($email, '..') !== false || 
            strpos($email, '@@') !== false ||
            substr($email, 0, 1) === '.' ||
            substr($email, -1) === '.') {
            return false;
        }
        
        return strtolower($validated);
    }
    
    /**
     * Validate and sanitize integer
     */
    public static function validateInt($value, $min = null, $max = null, $default = null) {
        if ($value === null || $value === '') {
            return $default;
        }
        
        $options = ['options' => []];
        if ($min !== null) {
            $options['options']['min_range'] = $min;
        }
        if ($max !== null) {
            $options['options']['max_range'] = $max;
        }
        if ($default !== null) {
            $options['options']['default'] = $default;
        }
        
        $validated = filter_var($value, FILTER_VALIDATE_INT, $options);
        return $validated !== false ? $validated : $default;
    }
    
    /**
     * Validate and sanitize float
     */
    public static function validateFloat($value, $min = null, $max = null, $default = null) {
        if ($value === null || $value === '') {
            return $default;
        }
        
        $validated = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($validated === false) {
            return $default;
        }
        
        if ($min !== null && $validated < $min) {
            return $default;
        }
        if ($max !== null && $validated > $max) {
            return $default;
        }
        
        return $validated;
    }
    
    /**
     * Validate and sanitize boolean
     */
    public static function validateBool($value, $default = false) {
        if ($value === null || $value === '') {
            return $default;
        }
        
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }
    
    /**
     * Validate and sanitize string
     */
    public static function validateString($value, $maxLength = 1000, $required = false) {
        if (empty($value)) {
            return $required ? false : '';
        }
        
        // Remove null bytes
        $value = str_replace("\0", '', $value);
        
        // Trim whitespace
        $value = trim($value);
        
        // Check length
        if (strlen($value) > $maxLength) {
            return false;
        }
        
        // Basic HTML entity encoding for safety
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    /**
     * Validate safe ID (alphanumeric, underscore, hyphen only)
     */
    public static function validateId($id, $required = false) {
        if (empty($id)) {
            return $required ? false : '';
        }
        
        $id = trim($id);
        
        // Check length
        if (strlen($id) > self::MAX_ID_LENGTH) {
            return false;
        }
        
        // Check pattern
        if (!preg_match(self::PATTERN_SAFE_ID, $id)) {
            return false;
        }
        
        return $id;
    }
    
    /**
     * Validate safe path component (prevent traversal)
     */
    public static function validatePathComponent($path, $required = false) {
        if (empty($path)) {
            return $required ? false : '';
        }
        
        $path = trim($path);
        
        // Check length
        if (strlen($path) > self::MAX_PATH_COMPONENT_LENGTH) {
            return false;
        }
        
        // Prevent directory traversal
        if (strpos($path, '..') !== false || 
            strpos($path, '//') !== false ||
            strpos($path, '\\') !== false ||
            strpos($path, "\0") !== false) {
            return false;
        }
        
        // Check for dangerous characters
        if (preg_match('/[<>"|*?:\x00-\x1f]/', $path)) {
            return false;
        }
        
        // Only allow safe characters
        if (!preg_match(self::PATTERN_SAFE_PATH, $path)) {
            return false;
        }
        
        return $path;
    }
    
    /**
     * Validate URL
     */
    public static function validateUrl($url, $required = false, $allowedSchemes = ['http', 'https']) {
        if (empty($url)) {
            return $required ? false : '';
        }
        
        $url = trim($url);
        
        // Check length
        if (strlen($url) > self::MAX_URL_LENGTH) {
            return false;
        }
        
        // Validate URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        
        // Check scheme
        $scheme = parse_url($url, PHP_URL_SCHEME);
        if (!in_array($scheme, $allowedSchemes, true)) {
            return false;
        }
        
        return $url;
    }
    
    /**
     * Validate phone number
     */
    public static function validatePhone($phone, $required = false) {
        if (empty($phone)) {
            return $required ? false : '';
        }
        
        $phone = trim($phone);
        
        // Remove common formatting characters
        $cleaned = preg_replace('/[\s\-\.\(\)]/', '', $phone);
        
        // Check if it's numeric (with optional + at start)
        if (!preg_match('/^\+?[0-9]{7,15}$/', $cleaned)) {
            return false;
        }
        
        return $cleaned;
    }
    
    /**
     * Validate array of values
     */
    public static function validateArray($array, $validator, $maxItems = 100) {
        if (!is_array($array)) {
            return [];
        }
        
        if (count($array) > $maxItems) {
            return false;
        }
        
        $validated = [];
        foreach ($array as $item) {
            $result = call_user_func($validator, $item);
            if ($result !== false) {
                $validated[] = $result;
            }
        }
        
        return $validated;
    }
    
    /**
     * Validate JSON structure
     */
    public static function validateJson($json, $maxDepth = 512) {
        if (empty($json)) {
            return null;
        }
        
        $decoded = json_decode($json, true, $maxDepth);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }
        
        return $decoded;
    }
    
    /**
     * Sanitize output for JSON response
     */
    public static function sanitizeForJson($data) {
        if (is_string($data)) {
            // Ensure UTF-8 encoding
            return mb_convert_encoding($data, 'UTF-8', 'UTF-8');
        }
        
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeForJson'], $data);
        }
        
        return $data;
    }
    
    /**
     * Validate request method
     */
    public static function validateMethod($allowed = ['GET', 'POST']) {
        $method = $_SERVER['REQUEST_METHOD'] ?? '';
        
        if (!in_array($method, $allowed, true)) {
            http_response_code(405);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed'
            ]);
            exit;
        }
        
        return $method;
    }
    
    /**
     * Get and validate request input
     */
    public static function getInput($method = 'POST') {
        if ($method === 'POST') {
            $input = file_get_contents('php://input');
            $data = self::validateJson($input);
            
            if ($data === false) {
                http_response_code(400);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid JSON input'
                ]);
                exit;
            }
            
            return $data;
        }
        
        return $_GET;
    }
    
    /**
     * Validate required fields
     */
    public static function validateRequired($data, $requiredFields) {
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Missing required fields',
                'missing_fields' => $missing
            ]);
            exit;
        }
        
        return true;
    }
}