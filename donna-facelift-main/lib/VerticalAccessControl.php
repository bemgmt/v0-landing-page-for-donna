<?php
/**
 * Vertical Access Control Helper
 * Provides middleware-like functions to enforce vertical-based access restrictions
 * Part of Phase 5 Expansion - Vertical-Specific Modules
 */

require_once __DIR__ . '/Verticals.php';
require_once __DIR__ . '/DataAccessFactory.php';
require_once __DIR__ . '/ApiResponder.php';

class VerticalAccessControl {
    
    /**
     * Verify that the authenticated user belongs to the required vertical
     * 
     * @param string $userId The authenticated user's ID
     * @param string $requiredVertical The vertical required for access
     * @param bool $exitOnFailure Whether to exit with 403 response on failure (default: true)
     * @return bool True if user has access, false otherwise
     * @throws Exception If database access fails
     */
    public static function requireVertical(string $userId, string $requiredVertical, bool $exitOnFailure = true): bool {
        // Validate the required vertical
        if (!Verticals::isValid($requiredVertical)) {
            throw new Exception("Invalid vertical specified: {$requiredVertical}");
        }
        
        // Get user data
        $dal = DataAccessFactory::create();
        $user = $dal->getUserById($userId);
        
        if (!$user) {
            if ($exitOnFailure) {
                ApiResponder::jsonNotFound('User not found');
            }
            return false;
        }
        
        // Check if user's vertical matches required vertical
        $userVertical = $user['vertical'] ?? null;
        
        if ($userVertical !== $requiredVertical) {
            if ($exitOnFailure) {
                $verticalName = Verticals::getDisplayName($requiredVertical);
                ApiResponder::jsonForbidden(
                    "Access denied. This endpoint is only available for {$verticalName} vertical users."
                );
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Verify that the user has selected a vertical (any vertical)
     * Useful for ensuring onboarding is complete
     * 
     * @param string $userId The authenticated user's ID
     * @param bool $exitOnFailure Whether to exit with 403 response on failure (default: true)
     * @return bool True if user has a vertical, false otherwise
     */
    public static function requireAnyVertical(string $userId, bool $exitOnFailure = true): bool {
        $dal = DataAccessFactory::create();
        $user = $dal->getUserById($userId);
        
        if (!$user) {
            if ($exitOnFailure) {
                ApiResponder::jsonNotFound('User not found');
            }
            return false;
        }
        
        $userVertical = $user['vertical'] ?? null;
        
        if ($userVertical === null) {
            if ($exitOnFailure) {
                ApiResponder::jsonForbidden(
                    'Please complete onboarding by selecting your industry vertical.'
                );
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Get the user's vertical without enforcing access control
     * 
     * @param string $userId The authenticated user's ID
     * @return string|null The user's vertical, or null if not set
     */
    public static function getUserVertical(string $userId): ?string {
        $dal = DataAccessFactory::create();
        $user = $dal->getUserById($userId);
        
        if (!$user) {
            return null;
        }
        
        return $user['vertical'] ?? null;
    }
    
    /**
     * Check if user has access to a specific vertical without exiting
     * Useful for conditional logic
     * 
     * @param string $userId The authenticated user's ID
     * @param string $requiredVertical The vertical to check
     * @return bool True if user has access, false otherwise
     */
    public static function hasVerticalAccess(string $userId, string $requiredVertical): bool {
        return self::requireVertical($userId, $requiredVertical, false);
    }
    
    /**
     * Get user data with vertical information
     * 
     * @param string $userId The authenticated user's ID
     * @return array|null User data with vertical metadata, or null if user not found
     */
    public static function getUserWithVertical(string $userId): ?array {
        $dal = DataAccessFactory::create();
        $user = $dal->getUserById($userId);
        
        if (!$user) {
            return null;
        }
        
        // Add vertical metadata
        if (isset($user['vertical']) && $user['vertical']) {
            $user['vertical_name'] = Verticals::getDisplayName($user['vertical']);
            $user['vertical_description'] = Verticals::getDescription($user['vertical']);
        }
        
        return $user;
    }
}

