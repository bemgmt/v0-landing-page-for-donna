<?php
/**
 * User Profile API
 * Retrieves and updates authenticated user profile information
 * Part of Phase 5 Expansion - Vertical-Specific Modules
 */

// Load environment and dependencies
require_once __DIR__ . '/../../bootstrap_env.php';
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../../lib/Verticals.php';
require_once __DIR__ . '/../../lib/DataAccessFactory.php';
require_once __DIR__ . '/../../lib/ApiResponder.php';

// CORS and authentication
$auth = donna_cors_and_auth();

// Only allow GET and PATCH requests
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Ensure user is authenticated
if (!isset($auth['user_id'])) {
    ApiResponder::jsonUnauthorized('User not authenticated');
}

try {
    $dal = DataAccessFactory::create();
    
    // GET: Retrieve user profile
    if ($method === 'GET') {
        $user = $dal->getUserById($auth['user_id']);
        
        if (!$user) {
            ApiResponder::jsonNotFound('User not found');
        }
        
        // Prepare response with vertical metadata
        $response = [
            'id' => $user['id'] ?? null,
            'clerk_id' => $user['clerk_id'] ?? null,
            'email' => $user['email'] ?? null,
            'name' => $user['name'] ?? null,
            'vertical' => $user['vertical'] ?? null,
            'vertical_name' => $user['vertical'] ? Verticals::getDisplayName($user['vertical']) : null,
            'profile' => $user['profile'] ?? [],
            'preferences' => $user['preferences'] ?? [],
            'status' => $user['status'] ?? 'active',
            'created_at' => $user['created_at'] ?? null,
            'last_active_at' => $user['last_active_at'] ?? null
        ];
        
        ApiResponder::jsonSuccess($response);
    }
    
    // PATCH: Update user profile
    elseif ($method === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            ApiResponder::jsonBadRequest('Invalid JSON input');
        }
        
        // Allowed fields for update
        $allowedFields = ['name', 'email', 'vertical', 'profile', 'preferences'];
        $updates = [];
        
        foreach ($input as $field => $value) {
            if (in_array($field, $allowedFields)) {
                // Special validation for vertical
                if ($field === 'vertical') {
                    if ($value !== null && !Verticals::isValid($value)) {
                        ApiResponder::jsonBadRequest('Invalid vertical. Allowed values: ' . implode(', ', Verticals::getAllowed()));
                    }
                }
                $updates[$field] = $value;
            }
        }
        
        if (empty($updates)) {
            ApiResponder::jsonBadRequest('No valid fields to update');
        }
        
        // Update user
        $success = $dal->updateUser($auth['user_id'], $updates);
        
        if (!$success) {
            ApiResponder::jsonServerError('Failed to update profile');
        }
        
        // Get updated user data
        $user = $dal->getUserById($auth['user_id']);
        
        // Log the change
        if (function_exists('log_info')) {
            log_info('User profile updated', [
                'user_id' => $auth['user_id'],
                'updated_fields' => array_keys($updates)
            ]);
        }
        
        // Prepare response
        $response = [
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user['id'] ?? null,
                'email' => $user['email'] ?? null,
                'name' => $user['name'] ?? null,
                'vertical' => $user['vertical'] ?? null,
                'vertical_name' => $user['vertical'] ? Verticals::getDisplayName($user['vertical']) : null,
                'profile' => $user['profile'] ?? [],
                'preferences' => $user['preferences'] ?? []
            ]
        ];
        
        ApiResponder::jsonSuccess($response);
    }
    
    else {
        ApiResponder::jsonMethodNotAllowed('Only GET and PATCH methods are allowed');
    }
    
} catch (Exception $e) {
    // Log error if Sentry is configured
    if (getenv('SENTRY_DSN')) {
        try {
            \Sentry\captureException($e);
        } catch (\Throwable $t) {
            // Silently fail if Sentry capture fails
        }
    }
    
    ApiResponder::jsonServerError('An error occurred: ' . $e->getMessage());
}

