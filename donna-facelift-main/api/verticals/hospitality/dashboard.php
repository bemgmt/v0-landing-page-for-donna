<?php
/**
 * Hospitality Vertical Dashboard API
 * Provides hospitality-specific functionality and data
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
    if (($user['vertical'] ?? null) !== Verticals::HOSPITALITY) {
        ApiResponder::jsonForbidden('Access denied. This endpoint is only available for Hospitality vertical users.');
    }
    
    // Handle different actions
    $action = $_GET['action'] ?? 'dashboard';
    
    switch ($action) {
        case 'dashboard':
            // Return hospitality dashboard data (placeholder)
            ApiResponder::jsonSuccess([
                'message' => 'Hospitality dashboard data',
                'user' => [
                    'name' => $user['name'] ?? 'Guest',
                    'vertical' => Verticals::getDisplayName(Verticals::HOSPITALITY)
                ],
                'stats' => [
                    'reservations_today' => 0,
                    'pending_requests' => 0,
                    'guest_satisfaction' => 0
                ],
                'features' => [
                    'reservation_management',
                    'concierge_services',
                    'guest_communications',
                    'event_coordination'
                ]
            ]);
            break;
            
        case 'reservations':
            // Placeholder for reservation management
            ApiResponder::jsonSuccess([
                'message' => 'Reservation management endpoint',
                'reservations' => []
            ]);
            break;
            
        case 'guests':
            // Placeholder for guest management
            ApiResponder::jsonSuccess([
                'message' => 'Guest management endpoint',
                'guests' => []
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

