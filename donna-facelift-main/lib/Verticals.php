<?php
/**
 * Vertical Industry Configuration
 * Defines supported industry verticals for DONNA's multi-vertical support
 * Part of Phase 5 Expansion - Vertical-Specific Modules
 */

class Verticals {
    /**
     * Supported vertical industry identifiers
     * These values must match the front-end vertical keys
     */
    const HOSPITALITY = 'hospitality';
    const REAL_ESTATE = 'real_estate';
    const PROFESSIONAL_SERVICES = 'professional_services';
    
    /**
     * Get all allowed verticals as an array
     * @return array List of valid vertical identifiers
     */
    public static function getAllowed(): array {
        return [
            self::HOSPITALITY,
            self::REAL_ESTATE,
            self::PROFESSIONAL_SERVICES
        ];
    }
    
    /**
     * Check if a vertical identifier is valid
     * @param string|null $vertical The vertical to validate
     * @return bool True if valid, false otherwise
     */
    public static function isValid(?string $vertical): bool {
        if ($vertical === null) {
            return false;
        }
        return in_array($vertical, self::getAllowed(), true);
    }
    
    /**
     * Get human-readable name for a vertical
     * @param string $vertical The vertical identifier
     * @return string Human-readable name
     */
    public static function getDisplayName(string $vertical): string {
        $names = [
            self::HOSPITALITY => 'Hospitality',
            self::REAL_ESTATE => 'Real Estate',
            self::PROFESSIONAL_SERVICES => 'Professional Services'
        ];
        
        return $names[$vertical] ?? 'Unknown';
    }
    
    /**
     * Get description for a vertical
     * @param string $vertical The vertical identifier
     * @return string Description of the vertical
     */
    public static function getDescription(string $vertical): string {
        $descriptions = [
            self::HOSPITALITY => 'Hotels, restaurants, event venues, and hospitality services',
            self::REAL_ESTATE => 'Real estate agencies, property management, and real estate services',
            self::PROFESSIONAL_SERVICES => 'Consulting, legal, accounting, and professional service firms'
        ];
        
        return $descriptions[$vertical] ?? '';
    }
    
    /**
     * Get all verticals with metadata
     * @return array Array of verticals with display names and descriptions
     */
    public static function getAllWithMetadata(): array {
        $verticals = [];
        foreach (self::getAllowed() as $vertical) {
            $verticals[] = [
                'id' => $vertical,
                'name' => self::getDisplayName($vertical),
                'description' => self::getDescription($vertical)
            ];
        }
        return $verticals;
    }
}

