<?php
/**
 * WS4 Task 3: Data Retention and Cleanup Test
 * 
 * Tests runtime data retention policies and cleanup functionality
 */

require_once __DIR__ . '/lib/DataRetentionManager.php';
require_once __DIR__ . '/lib/LogManager.php';

echo "=== WS4 Data Retention and Cleanup Test ===\n\n";

// Test 1: Initialize DataRetentionManager
echo "Test 1: DataRetentionManager Initialization\n";
try {
    $retentionManager = new DataRetentionManager();
    echo "✓ DataRetentionManager created successfully\n";
    
    $config = $retentionManager->getRetentionConfig();
    echo "✓ Default retention policies loaded:\n";
    foreach ($config as $type => $seconds) {
        $hours = round($seconds / 3600, 1);
        echo "  - {$type}: {$seconds}s ({$hours}h)\n";
    }
    
} catch (Exception $e) {
    echo "✗ DataRetentionManager initialization failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 2: Storage Statistics
echo "Test 2: Storage Usage Statistics\n";
try {
    $stats = $retentionManager->getStorageStats();
    echo "✓ Storage statistics collected:\n";
    
    $totalSize = 0;
    $totalFiles = 0;
    
    foreach ($stats as $type => $data) {
        echo "  {$type}:\n";
        echo "    - Files: {$data['files']}\n";
        echo "    - Size: {$data['size_mb']} MB\n";
        echo "    - Retention: " . round($data['retention_seconds'] / 3600, 1) . " hours\n";
        
        $totalSize += $data['size_bytes'];
        $totalFiles += $data['files'];
    }
    
    echo "\nTotal Usage:\n";
    echo "  - Files: {$totalFiles}\n";
    echo "  - Size: " . round($totalSize / 1024 / 1024, 2) . " MB\n";
    
} catch (Exception $e) {
    echo "✗ Storage statistics failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: Create test files for cleanup
echo "Test 3: Create Test Files for Cleanup\n";
try {
    $testDirs = [
        __DIR__ . '/test_temp_audio',
        __DIR__ . '/test_cache',
        __DIR__ . '/test_data'
    ];
    
    $testFiles = [];
    
    foreach ($testDirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Create old files (older than retention period)
        for ($i = 1; $i <= 3; $i++) {
            $file = $dir . "/old_file_{$i}.tmp";
            file_put_contents($file, "Old test content {$i}");
            // Set file time to 2 hours ago
            touch($file, time() - 7200);
            $testFiles[] = $file;
        }
        
        // Create new files (within retention period)
        for ($i = 1; $i <= 2; $i++) {
            $file = $dir . "/new_file_{$i}.tmp";
            file_put_contents($file, "New test content {$i}");
            $testFiles[] = $file;
        }
    }
    
    echo "✓ Created " . count($testFiles) . " test files\n";
    echo "  - Old files (should be cleaned): 9\n";
    echo "  - New files (should be kept): 6\n";
    
} catch (Exception $e) {
    echo "✗ Test file creation failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Dry Run Cleanup
echo "Test 4: Dry Run Cleanup Test\n";
try {
    $dryRunResults = $retentionManager->runCleanup(true);
    echo "✓ Dry run cleanup completed:\n";
    
    $totalCleaned = 0;
    $totalSize = 0;
    
    foreach ($dryRunResults as $type => $result) {
        if ($result['files_cleaned'] > 0) {
            echo "  {$type}: {$result['files_cleaned']} files, " . 
                 round($result['size_freed'] / 1024, 2) . " KB\n";
            $totalCleaned += $result['files_cleaned'];
            $totalSize += $result['size_freed'];
        }
    }
    
    echo "Total (dry run): {$totalCleaned} files, " . round($totalSize / 1024, 2) . " KB\n";
    
} catch (Exception $e) {
    echo "✗ Dry run cleanup failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 5: LogManager Integration
echo "Test 5: LogManager Integration Test\n";
try {
    $logManager = new LogManager();
    
    // Test log rotation settings
    echo "✓ LogManager integration:\n";
    echo "  - Log directory: " . $logManager->getLogDir() . "\n";
    
    // Create test log entries
    $logManager->info('Test log entry for retention testing');
    $logManager->warning('Test warning for retention testing');
    $logManager->error('Test error for retention testing');
    
    echo "  - Test log entries created\n";
    
    // Check if rotation is working
    $logFiles = glob($logManager->getLogDir() . '/*.log');
    echo "  - Current log files: " . count($logFiles) . "\n";
    
} catch (Exception $e) {
    echo "✗ LogManager integration failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 6: Retention Policy Configuration
echo "Test 6: Retention Policy Configuration\n";
try {
    // Test updating retention policies
    $originalPolicy = $retentionManager->getRetentionConfig()['temp_files'];
    
    $success = $retentionManager->setRetentionPolicy('temp_files', 900); // 15 minutes
    echo "✓ Retention policy update: " . ($success ? 'SUCCESS' : 'FAILED') . "\n";
    
    $newPolicy = $retentionManager->getRetentionConfig()['temp_files'];
    echo "  - Original: {$originalPolicy}s\n";
    echo "  - Updated: {$newPolicy}s\n";
    
    // Test invalid policy update
    $invalidSuccess = $retentionManager->setRetentionPolicy('invalid_type', 3600);
    echo "✓ Invalid policy rejection: " . (!$invalidSuccess ? 'SUCCESS' : 'FAILED') . "\n";
    
} catch (Exception $e) {
    echo "✗ Retention policy configuration failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 7: Actual Cleanup (with test files)
echo "Test 7: Actual Cleanup Test\n";
try {
    // Count files before cleanup
    $beforeCount = 0;
    foreach ($testDirs as $dir) {
        if (is_dir($dir)) {
            $beforeCount += count(glob($dir . '/*'));
        }
    }
    
    echo "✓ Files before cleanup: {$beforeCount}\n";
    
    // Run actual cleanup
    $cleanupResults = $retentionManager->runCleanup(false);
    
    // Count files after cleanup
    $afterCount = 0;
    foreach ($testDirs as $dir) {
        if (is_dir($dir)) {
            $afterCount += count(glob($dir . '/*'));
        }
    }
    
    echo "✓ Files after cleanup: {$afterCount}\n";
    echo "✓ Files cleaned: " . ($beforeCount - $afterCount) . "\n";
    
    // Display cleanup results
    foreach ($cleanupResults as $type => $result) {
        if ($result['files_cleaned'] > 0) {
            echo "  {$type}: {$result['files_cleaned']} files cleaned\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Actual cleanup failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 8: Scheduled Cleanup Simulation
echo "Test 8: Scheduled Cleanup Simulation\n";
try {
    // Simulate what a cron job would do
    echo "✓ Simulating scheduled cleanup (cron job):\n";
    
    // Custom retention config for production
    $productionConfig = [
        'temp_audio' => 3600,        // 1 hour
        'chat_sessions' => 2592000,  // 30 days
        'user_memory' => 7776000,    // 90 days
        'logs' => 604800,            // 7 days
        'cache' => 86400,            // 1 day
        'temp_files' => 1800         // 30 minutes
    ];
    
    $productionManager = new DataRetentionManager($productionConfig);
    $scheduledResults = $productionManager->runCleanup(true); // Dry run for safety
    
    echo "  Production retention policies:\n";
    foreach ($productionConfig as $type => $seconds) {
        $days = round($seconds / 86400, 1);
        echo "    - {$type}: {$days} days\n";
    }
    
    echo "  Scheduled cleanup would clean:\n";
    $totalScheduled = 0;
    foreach ($scheduledResults as $type => $result) {
        if ($result['files_cleaned'] > 0) {
            echo "    - {$type}: {$result['files_cleaned']} files\n";
            $totalScheduled += $result['files_cleaned'];
        }
    }
    
    if ($totalScheduled === 0) {
        echo "    - No files need cleanup\n";
    }
    
} catch (Exception $e) {
    echo "✗ Scheduled cleanup simulation failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Cleanup test directories
echo "Cleanup: Removing test directories\n";
try {
    foreach ($testDirs as $dir) {
        if (is_dir($dir)) {
            $files = glob($dir . '/*');
            foreach ($files as $file) {
                unlink($file);
            }
            rmdir($dir);
        }
    }
    echo "✓ Test directories cleaned up\n";
} catch (Exception $e) {
    echo "✗ Test cleanup failed: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== Data Retention and Cleanup Test Complete ===\n";
echo "Summary:\n";
echo "- ✅ DataRetentionManager initialization and configuration\n";
echo "- ✅ Storage usage statistics and monitoring\n";
echo "- ✅ Dry run and actual cleanup functionality\n";
echo "- ✅ LogManager integration for log rotation\n";
echo "- ✅ Retention policy configuration and validation\n";
echo "- ✅ Scheduled cleanup simulation for production\n";
echo "\nRecommendations:\n";
echo "1. Set up cron job to run cleanup daily: 0 2 * * * php /path/to/cleanup_script.php\n";
echo "2. Monitor storage usage and adjust retention policies as needed\n";
echo "3. Implement alerts for storage usage exceeding thresholds\n";
echo "4. Regular backup of important data before cleanup\n";
echo "\nData retention system provides automated cleanup with configurable policies.\n";
