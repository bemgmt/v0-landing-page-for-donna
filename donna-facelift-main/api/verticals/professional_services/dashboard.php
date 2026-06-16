<?php
/**
 * Professional Services Vertical Dashboard API
 * Provides professional services-specific functionality and data
 * Part of Phase 5 Expansion - Vertical-Specific Modules
 */

// Load environment and dependencies
require_once __DIR__ . '/../../../bootstrap_env.php';
require_once __DIR__ . '/../../_auth.php';
require_once __DIR__ . '/../../../lib/Verticals.php';
require_once __DIR__ . '/../../../lib/DataAccessFactory.php';
require_once __DIR__ . '/../../../lib/ApiResponder.php';

// CORS and authentication
$auth = donna_cors_and_auth();

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Ensure user is authenticated
if (!isset($auth['user_id'])) {
    ApiResponder::jsonUnauthorized('User not authenticated');
}

try {
    $dal = DataAccessFactory::create();
    
    // Get user and verify vertical access
    $user = $dal->getUserById($auth['user_id']);
    if (!$user) {
        ApiResponder::jsonNotFound('User not found');
    }
    
    // Enforce vertical-based access control
    if (($user['vertical'] ?? null) !== Verticals::PROFESSIONAL_SERVICES) {
        ApiResponder::jsonForbidden('Access denied. This endpoint is only available for Professional Services vertical users.');
    }
    
    // Handle different actions
    $action = $_GET['action'] ?? 'dashboard';
    
    switch ($action) {
        case 'dashboard':
            // Return professional services dashboard data (placeholder)
            ApiResponder::jsonSuccess([
                'message' => 'Professional Services dashboard data',
                'user' => [
                    'name' => $user['name'] ?? 'Professional',
                    'vertical' => Verticals::getDisplayName(Verticals::PROFESSIONAL_SERVICES)
                ],
                'stats' => [
                    'active_projects' => 0,
                    'pending_consultations' => 0,
                    'billable_hours_this_week' => 0
                ],
                'features' => [
                    'project_management',
                    'client_portal',
                    'time_tracking',
                    'document_management'
                ]
            ]);
            break;
            
        case 'projects':
            // Placeholder for project management
            ApiResponder::jsonSuccess([
                'message' => 'Project management endpoint',
                'projects' => []
            ]);
            break;
            
        case 'clients':
            // Placeholder for client management
            ApiResponder::jsonSuccess([
                'message' => 'Client management endpoint',
                'clients' => []
            ]);
            break;
            
        default:
            ApiResponder::jsonBadRequest('Invalid action');
    }
    
} catch (Exception $e) {
    // Log error if Sentry is configured
    if (getenv('SENTRY_DSN')) {
        try {
            \Sentry\captureException($e);
        } catch (\Throwable $t) {
            // Silently fail
        }
    }
    
    ApiResponder::jsonServerError('An error occurred: ' . $e->getMessage());
}

