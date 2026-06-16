<?php
/**
 * User Vertical Selection API
 * Allows authenticated users to set their industry vertical during onboarding
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

// Only allow POST and GET requests
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $dal = DataAccessFactory::create();
    
    // GET: Retrieve available verticals
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';
        
        if ($action === 'list') {
            // Return list of available verticals with metadata
            ApiResponder::jsonSuccess([
                'verticals' => Verticals::getAllWithMetadata()
            ]);
        } elseif ($action === 'current') {
            // Return current user's vertical
            if (!isset($auth['user_id'])) {
                ApiResponder::jsonUnauthorized('User not authenticated');
            }
            
            $user = $dal->getUserById($auth['user_id']);
            if (!$user) {
                ApiResponder::jsonNotFound('User not found');
            }
            
            ApiResponder::jsonSuccess([
                'vertical' => $user['vertical'] ?? null,
                'vertical_name' => $user['vertical'] ? Verticals::getDisplayName($user['vertical']) : null
            ]);
        } else {
            ApiResponder::jsonBadRequest('Invalid action');
        }
    }
    
    // POST: Set user's vertical
    elseif ($method === 'POST') {
        // Ensure user is authenticated
        if (!isset($auth['user_id'])) {
            ApiResponder::jsonUnauthorized('User not authenticated');
        }
        
        // Parse request body
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            ApiResponder::jsonBadRequest('Invalid JSON input');
        }
        
        // Validate vertical
        $vertical = $input['vertical'] ?? null;
        if (!$vertical) {
            ApiResponder::jsonBadRequest('Vertical is required');
        }
        
        if (!Verticals::isValid($vertical)) {
            ApiResponder::jsonBadRequest('Invalid vertical. Allowed values: ' . implode(', ', Verticals::getAllowed()));
        }
        
        // Get user
        $user = $dal->getUserById($auth['user_id']);
        if (!$user) {
            ApiResponder::jsonNotFound('User not found');
        }
        
        // Update user's vertical
        $success = $dal->updateUser($auth['user_id'], ['vertical' => $vertical]);
        
        if (!$success) {
            ApiResponder::jsonServerError('Failed to update vertical');
        }
        
        // Log the change
        if (function_exists('log_info')) {
            log_info('User vertical updated', [
                'user_id' => $auth['user_id'],
                'vertical' => $vertical,
                'clerk_id' => $user['clerk_id'] ?? null
            ]);
        }
        
        ApiResponder::jsonSuccess([
            'message' => 'Vertical updated successfully',
            'vertical' => $vertical,
            'vertical_name' => Verticals::getDisplayName($vertical)
        ]);
    }
    
    else {
        ApiResponder::jsonMethodNotAllowed('Only GET and POST methods are allowed');
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

