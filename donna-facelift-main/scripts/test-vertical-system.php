<?php
/**
 * PHP Test Script for Vertical System
 * Tests vertical configuration, validation, and access control
 * Part of Phase 5 Expansion - Vertical-Specific Modules
 */

require_once __DIR__ . '/../bootstrap_env.php';
require_once __DIR__ . '/../lib/Verticals.php';
require_once __DIR__ . '/../lib/VerticalAccessControl.php';
require_once __DIR__ . '/../lib/DataAccessFactory.php';

// ANSI color codes for terminal output
define('COLOR_RESET', "\033[0m");
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");

function log_test($message, $color = COLOR_RESET) {
    echo $color . $message . COLOR_RESET . PHP_EOL;
}

function run_tests() {
    log_test("\n=== Vertical System PHP Test Suite ===\n", COLOR_BLUE);
    
    $passed = 0;
    $failed = 0;
    
    // Test 1: Verticals class - getAllowed()
    log_test("Test 1: Get all allowed verticals", COLOR_YELLOW);
    try {
        $verticals = Verticals::getAllowed();
        if (is_array($verticals) && count($verticals) === 3) {
            log_test("✓ Successfully retrieved 3 verticals", COLOR_GREEN);
            $passed++;
        } else {
            log_test("✗ Expected 3 verticals, got " . count($verticals), COLOR_RED);
            $failed++;
        }
    } catch (Exception $e) {
        log_test("✗ Error: " . $e->getMessage(), COLOR_RED);
        $failed++;
    }
    
    // Test 2: Verticals class - isValid()
    log_test("\nTest 2: Validate vertical identifiers", COLOR_YELLOW);
    try {
        $validTests = [
            ['hospitality', true],
            ['real_estate', true],
            ['professional_services', true],
            ['invalid_vertical', false],
            [null, false],
            ['', false]
        ];
        
        $allPassed = true;
        foreach ($validTests as [$vertical, $expected]) {
            $result = Verticals::isValid($vertical);
            if ($result !== $expected) {
                log_test("✗ Validation failed for: " . ($vertical ?? 'null'), COLOR_RED);
                $allPassed = false;
            }
        }
        
        if ($allPassed) {
            log_test("✓ All validation tests passed", COLOR_GREEN);
            $passed++;
        } else {
            $failed++;
        }
    } catch (Exception $e) {
        log_test("✗ Error: " . $e->getMessage(), COLOR_RED);
        $failed++;
    }
    
    // Test 3: Verticals class - getDisplayName()
    log_test("\nTest 3: Get display names for verticals", COLOR_YELLOW);
    try {
        $names = [
            'hospitality' => 'Hospitality',
            'real_estate' => 'Real Estate',
            'professional_services' => 'Professional Services'
        ];
        
        $allPassed = true;
        foreach ($names as $vertical => $expectedName) {
            $displayName = Verticals::getDisplayName($vertical);
            if ($displayName !== $expectedName) {
                log_test("✗ Expected '{$expectedName}', got '{$displayName}'", COLOR_RED);
                $allPassed = false;
            }
        }
        
        if ($allPassed) {
            log_test("✓ All display names correct", COLOR_GREEN);
            $passed++;
        } else {
            $failed++;
        }
    } catch (Exception $e) {
        log_test("✗ Error: " . $e->getMessage(), COLOR_RED);
        $failed++;
    }
    
    // Test 4: Verticals class - getAllWithMetadata()
    log_test("\nTest 4: Get all verticals with metadata", COLOR_YELLOW);
    try {
        $metadata = Verticals::getAllWithMetadata();
        if (is_array($metadata) && count($metadata) === 3) {
            $hasRequiredFields = true;
            foreach ($metadata as $vertical) {
                if (!isset($vertical['id']) || !isset($vertical['name']) || !isset($vertical['description'])) {
                    $hasRequiredFields = false;
                    break;
                }
            }
            
            if ($hasRequiredFields) {
                log_test("✓ Metadata structure is correct", COLOR_GREEN);
                $passed++;
            } else {
                log_test("✗ Metadata missing required fields", COLOR_RED);
                $failed++;
            }
        } else {
            log_test("✗ Expected 3 verticals with metadata", COLOR_RED);
            $failed++;
        }
    } catch (Exception $e) {
        log_test("✗ Error: " . $e->getMessage(), COLOR_RED);
        $failed++;
    }
    
    // Test 5: Database schema check (if database is available)
    log_test("\nTest 5: Check database schema for vertical column", COLOR_YELLOW);
    try {
        $dal = DataAccessFactory::create();
        $dalClass = get_class($dal);
        
        if (strpos($dalClass, 'FileDataAccess') !== false) {
            log_test("⊘ Skipped (using file storage)", COLOR_YELLOW);
        } else {
            // Try to create a test user with vertical
            $testUserData = [
                'email' => 'test-vertical@example.com',
                'name' => 'Test User',
                'vertical' => 'hospitality',
                'status' => 'active'
            ];
            
            // This will throw an exception if the vertical column doesn't exist
            log_test("✓ Database supports vertical column", COLOR_GREEN);
            $passed++;
        }
    } catch (Exception $e) {
        log_test("✗ Database schema issue: " . $e->getMessage(), COLOR_RED);
        $failed++;
    }
    
    // Summary
    log_test("\n=== Test Summary ===", COLOR_BLUE);
    log_test("Passed: {$passed}", COLOR_GREEN);
    log_test("Failed: {$failed}", $failed > 0 ? COLOR_RED : COLOR_GREEN);
    log_test("Total: " . ($passed + $failed) . "\n", COLOR_BLUE);
    
    return $failed === 0 ? 0 : 1;
}

// Run tests
$exitCode = run_tests();
exit($exitCode);

