#!/usr/bin/env php
<?php
/**
 * WS4 Task 3: Runtime Data Cleanup Script
 * 
 * Production-ready script for scheduled cleanup of runtime data
 * Designed to be run via cron job
 * 
 * Usage:
 *   php cleanup_runtime_data.php [--dry-run] [--verbose] [--config=path]
 * 
 * Cron example (daily at 2 AM):
 *   0 2 * * * /usr/bin/php /path/to/cleanup_runtime_data.php >> /var/log/donna_cleanup.log 2>&1
 */

// Change to script directory
chdir(dirname(__DIR__));

require_once __DIR__ . '/../lib/DataRetentionManager.php';

// Parse command line arguments
$options = getopt('', ['dry-run', 'verbose', 'config:']);
$dryRun = isset($options['dry-run']);
$verbose = isset($options['verbose']);
$configFile = $options['config'] ?? null;

// Load configuration
$config = [];
if ($configFile && file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true) ?: [];
} else {
    // Production default configuration - comprehensive cleanup policy
    $config = [
        'temp_audio' => 3600,        // 1 hour - voice system temp files
        'chat_sessions' => 2592000,  // 30 days - chat history and sessions
        'user_memory' => 7776000,    // 90 days - user memory snapshots
        'logs' => 604800,            // 7 days - application logs
        'cache' => 86400,            // 1 day - response cache files
        'temp_files' => 1800,        // 30 minutes - general temp files
        'conversations' => 2592000,  // 30 days - conversation data
        'generated_pages' => 604800, // 7 days - generated page cache
        'api_logs' => 604800,        // 7 days - API access logs
        'error_logs' => 1209600      // 14 days - error logs (keep longer)
    ];
}

// Initialize retention manager
try {
    $retentionManager = new DataRetentionManager($config);
    
    $timestamp = date('Y-m-d H:i:s');
    echo "[{$timestamp}] Starting data retention cleanup" . ($dryRun ? ' (DRY RUN)' : '') . "\n";
    
    if ($verbose) {
        echo "Configuration:\n";
        foreach ($config as $type => $seconds) {
            $hours = round($seconds / 3600, 1);
            echo "  {$type}: {$seconds}s ({$hours}h)\n";
        }
        echo "\n";
    }
    
    // Get storage stats before cleanup
    if ($verbose) {
        $beforeStats = $retentionManager->getStorageStats();
        echo "Storage before cleanup:\n";
        foreach ($beforeStats as $type => $data) {
            echo "  {$type}: {$data['files']} files, {$data['size_mb']} MB\n";
        }
        echo "\n";
    }
    
    // Run cleanup
    $results = $retentionManager->runCleanup($dryRun);
    
    // Report results
    $totalCleaned = array_sum(array_column($results, 'files_cleaned'));
    $totalSize = array_sum(array_column($results, 'size_freed'));
    $totalSizeMB = round($totalSize / 1024 / 1024, 2);
    
    echo "Cleanup completed:\n";
    echo "  Total files cleaned: {$totalCleaned}\n";
    echo "  Total size freed: {$totalSizeMB} MB\n";
    
    if ($verbose || $totalCleaned > 0) {
        echo "\nDetails by type:\n";
        foreach ($results as $type => $result) {
            if ($result['files_cleaned'] > 0 || $verbose) {
                $sizeMB = round($result['size_freed'] / 1024 / 1024, 2);
                echo "  {$type}: {$result['files_cleaned']} files, {$sizeMB} MB\n";
            }
        }
    }
    
    // Get storage stats after cleanup
    if ($verbose && !$dryRun) {
        echo "\nStorage after cleanup:\n";
        $afterStats = $retentionManager->getStorageStats();
        foreach ($afterStats as $type => $data) {
            echo "  {$type}: {$data['files']} files, {$data['size_mb']} MB\n";
        }
    }
    
    // Exit with success
    $endTimestamp = date('Y-m-d H:i:s');
    echo "[{$endTimestamp}] Cleanup completed successfully\n";
    exit(0);
    
} catch (Exception $e) {
    $errorTimestamp = date('Y-m-d H:i:s');
    echo "[{$errorTimestamp}] ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

/**
 * Display usage information
 */
function showUsage() {
    echo "Usage: php cleanup_runtime_data.php [options]\n";
    echo "\nOptions:\n";
    echo "  --dry-run     Simulate cleanup without actually deleting files\n";
    echo "  --verbose     Show detailed output\n";
    echo "  --config=FILE Load retention configuration from JSON file\n";
    echo "\nExamples:\n";
    echo "  php cleanup_runtime_data.php --dry-run --verbose\n";
    echo "  php cleanup_runtime_data.php --config=/etc/donna/retention.json\n";
    echo "\nCron example (daily at 2 AM):\n";
    echo "  0 2 * * * /usr/bin/php /path/to/cleanup_runtime_data.php\n";
    echo "\nConfiguration file format (JSON):\n";
    echo "{\n";
    echo "  \"temp_audio\": 3600,\n";
    echo "  \"chat_sessions\": 2592000,\n";
    echo "  \"user_memory\": 7776000,\n";
    echo "  \"logs\": 604800,\n";
    echo "  \"cache\": 86400,\n";
    echo "  \"temp_files\": 1800\n";
    echo "}\n";
}

// Show usage if --help is provided
if (isset($options['help'])) {
    showUsage();
    exit(0);
}
