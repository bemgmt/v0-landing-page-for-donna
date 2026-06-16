#!/usr/bin/env php
<?php
/**
 * Temporary Files Cleanup Script
 * Part of WS4 Data Management - Checkpoint 2
 * 
 * Removes temporary files older than specified age:
 * - temp_audio/* files
 * - Old log files
 * - Orphaned session files
 * - Cache files past TTL
 * 
 * Usage: php cleanup-temp.php [--age-minutes=30] [--dry-run] [--verbose]
 */

// Configuration
$config = [
    'default_age_minutes' => 30,
    'log_retention_days' => 7,
    'session_retention_hours' => 24,
    'cache_retention_hours' => 12,
    'dry_run' => false,
    'verbose' => false
];

// Parse command line arguments
$options = getopt('', ['age-minutes:', 'dry-run', 'verbose', 'help']);

if (isset($options['help'])) {
    showHelp();
    exit(0);
}

$config['age_minutes'] = intval($options['age-minutes'] ?? $config['default_age_minutes']);
$config['dry_run'] = isset($options['dry-run']);
$config['verbose'] = isset($options['verbose']);

// Determine base directory
$scriptDir = dirname(__FILE__);
$baseDir = dirname($scriptDir);

// Initialize counters
$stats = [
    'temp_audio' => ['checked' => 0, 'removed' => 0, 'size' => 0],
    'logs' => ['checked' => 0, 'removed' => 0, 'size' => 0],
    'sessions' => ['checked' => 0, 'removed' => 0, 'size' => 0],
    'cache' => ['checked' => 0, 'removed' => 0, 'size' => 0],
    'rate_limits' => ['checked' => 0, 'removed' => 0, 'size' => 0],
    'total_size_freed' => 0
];

// Start cleanup
logMessage("Starting cleanup process...");
logMessage("Configuration: " . json_encode($config));

// 1. Clean temp_audio directory
cleanTempAudio($baseDir, $config, $stats);

// 2. Clean old log files
cleanOldLogs($baseDir, $config, $stats);

// 3. Clean orphaned session files
cleanOrphanedSessions($baseDir, $config, $stats);

// 4. Clean expired cache files
cleanExpiredCache($baseDir, $config, $stats);

// 5. Clean expired rate limit files
cleanRateLimitFiles($baseDir, $config, $stats);

// Report results
reportResults($stats, $config);

/**
 * Clean temporary audio files
 */
function cleanTempAudio($baseDir, $config, &$stats) {
    $tempAudioDir = $baseDir . '/temp_audio';
    
    if (!is_dir($tempAudioDir)) {
        logMessage("temp_audio directory not found, skipping...", $config);
        return;
    }
    
    logMessage("Cleaning temp_audio directory...", $config);
    $cutoffTime = time() - ($config['age_minutes'] * 60);
    
    $files = glob($tempAudioDir . '/*');
    foreach ($files as $file) {
        if (is_file($file)) {
            $stats['temp_audio']['checked']++;
            
            if (filemtime($file) < $cutoffTime) {
                $size = filesize($file);
                
                if ($config['dry_run']) {
                    logMessage("  [DRY RUN] Would remove: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                } else {
                    if (@unlink($file)) {
                        logMessage("  Removed: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                        $stats['temp_audio']['removed']++;
                        $stats['temp_audio']['size'] += $size;
                        $stats['total_size_freed'] += $size;
                    } else {
                        logMessage("  Failed to remove: " . basename($file), $config);
                    }
                }
            }
        }
    }
}

/**
 * Clean old log files
 */
function cleanOldLogs($baseDir, $config, &$stats) {
    $logDirs = [
        $baseDir . '/api/logs',
        $baseDir . '/logs',
        $baseDir . '/data/logs'
    ];
    
    $cutoffTime = time() - ($config['log_retention_days'] * 86400);
    
    foreach ($logDirs as $logDir) {
        if (!is_dir($logDir)) {
            continue;
        }
        
        logMessage("Cleaning log directory: $logDir", $config);
        
        $files = glob($logDir . '/*.{log,txt}', GLOB_BRACE);
        foreach ($files as $file) {
            if (is_file($file)) {
                $stats['logs']['checked']++;
                
                // Skip current log files
                if (strpos(basename($file), date('Y-m-d')) !== false) {
                    continue;
                }
                
                if (filemtime($file) < $cutoffTime) {
                    $size = filesize($file);
                    
                    if ($config['dry_run']) {
                        logMessage("  [DRY RUN] Would remove log: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                    } else {
                        // Compress old logs before deletion if they're large
                        if ($size > 1048576 && !str_ends_with($file, '.gz')) { // > 1MB
                            $gzFile = $file . '.gz';
                            if (compressFile($file, $gzFile)) {
                                logMessage("  Compressed: " . basename($file) . " -> " . basename($gzFile), $config);
                                $file = $gzFile;
                                $size = filesize($gzFile);
                            }
                        }
                        
                        if (@unlink($file)) {
                            logMessage("  Removed log: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                            $stats['logs']['removed']++;
                            $stats['logs']['size'] += $size;
                            $stats['total_size_freed'] += $size;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Clean orphaned session files
 */
function cleanOrphanedSessions($baseDir, $config, &$stats) {
    $sessionDirs = [
        $baseDir . '/data/chat_sessions',
        $baseDir . '/data/sessions'
    ];
    
    $cutoffTime = time() - ($config['session_retention_hours'] * 3600);
    
    foreach ($sessionDirs as $sessionDir) {
        if (!is_dir($sessionDir)) {
            continue;
        }
        
        logMessage("Cleaning session directory: $sessionDir", $config);
        
        $files = glob($sessionDir . '/*.json');
        foreach ($files as $file) {
            if (is_file($file)) {
                $stats['sessions']['checked']++;
                
                // Check if session is orphaned (no recent activity)
                if (filemtime($file) < $cutoffTime) {
                    $data = @json_decode(file_get_contents($file), true);
                    
                    // Skip active sessions
                    if (isset($data['last_activity']) && 
                        strtotime($data['last_activity']) > $cutoffTime) {
                        continue;
                    }
                    
                    $size = filesize($file);
                    
                    if ($config['dry_run']) {
                        logMessage("  [DRY RUN] Would remove session: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                    } else {
                        if (@unlink($file)) {
                            logMessage("  Removed session: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                            $stats['sessions']['removed']++;
                            $stats['sessions']['size'] += $size;
                            $stats['total_size_freed'] += $size;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Clean expired cache files
 */
function cleanExpiredCache($baseDir, $config, &$stats) {
    $cacheDirs = [
        $baseDir . '/data/cache',
        $baseDir . '/cache'
    ];
    
    $cutoffTime = time() - ($config['cache_retention_hours'] * 3600);
    
    foreach ($cacheDirs as $cacheDir) {
        if (!is_dir($cacheDir)) {
            continue;
        }
        
        logMessage("Cleaning cache directory: $cacheDir", $config);
        
        $files = glob($cacheDir . '/*.{cache,json,tmp}', GLOB_BRACE);
        foreach ($files as $file) {
            if (is_file($file)) {
                $stats['cache']['checked']++;
                
                // Check cache expiry
                $expired = false;
                
                // Check file age
                if (filemtime($file) < $cutoffTime) {
                    $expired = true;
                }
                
                // Check internal TTL if it's a cache file
                if (str_ends_with($file, '.cache')) {
                    $content = @file_get_contents($file);
                    if ($content) {
                        $data = @unserialize($content);
                        if (isset($data['expires']) && $data['expires'] < time()) {
                            $expired = true;
                        }
                    }
                }
                
                if ($expired) {
                    $size = filesize($file);
                    
                    if ($config['dry_run']) {
                        logMessage("  [DRY RUN] Would remove cache: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                    } else {
                        if (@unlink($file)) {
                            logMessage("  Removed cache: " . basename($file) . " (" . formatBytes($size) . ")", $config);
                            $stats['cache']['removed']++;
                            $stats['cache']['size'] += $size;
                            $stats['total_size_freed'] += $size;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Clean expired rate limit files
 */
function cleanRateLimitFiles($baseDir, $config, &$stats) {
    $rateLimitDir = $baseDir . '/data/rate_limits';
    
    if (!is_dir($rateLimitDir)) {
        return;
    }
    
    logMessage("Cleaning rate limit directory...", $config);
    
    // Rate limit files expire after 1 minute (60 seconds)
    $cutoffTime = time() - 60;
    
    $files = glob($rateLimitDir . '/*.txt');
    foreach ($files as $file) {
        if (is_file($file)) {
            $stats['rate_limits']['checked']++;
            
            if (filemtime($file) < $cutoffTime) {
                $size = filesize($file);
                
                if ($config['dry_run']) {
                    logMessage("  [DRY RUN] Would remove rate limit: " . basename($file), $config);
                } else {
                    if (@unlink($file)) {
                        logMessage("  Removed rate limit: " . basename($file), $config);
                        $stats['rate_limits']['removed']++;
                        $stats['rate_limits']['size'] += $size;
                        $stats['total_size_freed'] += $size;
                    }
                }
            }
        }
    }
}

/**
 * Compress a file
 */
function compressFile($source, $dest) {
    $data = @file_get_contents($source);
    if (!$data) {
        return false;
    }
    
    $gz = @gzopen($dest, 'w9');
    if (!$gz) {
        return false;
    }
    
    gzwrite($gz, $data);
    gzclose($gz);
    
    @unlink($source);
    return true;
}

/**
 * Format bytes to human readable
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * Log message
 */
function logMessage($message, $config = null) {
    if ($config && !$config['verbose'] && strpos($message, '  ') === 0) {
        return; // Skip detailed messages in non-verbose mode
    }
    
    echo "[" . date('Y-m-d H:i:s') . "] " . $message . "\n";
}

/**
 * Report cleanup results
 */
function reportResults($stats, $config) {
    echo "\n" . str_repeat('=', 60) . "\n";
    echo "CLEANUP SUMMARY" . ($config['dry_run'] ? " (DRY RUN)" : "") . "\n";
    echo str_repeat('=', 60) . "\n\n";
    
    $totalChecked = 0;
    $totalRemoved = 0;
    
    foreach ($stats as $category => $data) {
        if ($category === 'total_size_freed') continue;
        
        if ($data['checked'] > 0) {
            echo sprintf("%-15s: Checked %d, Removed %d, Freed %s\n",
                ucfirst(str_replace('_', ' ', $category)),
                $data['checked'],
                $data['removed'],
                formatBytes($data['size'])
            );
            
            $totalChecked += $data['checked'];
            $totalRemoved += $data['removed'];
        }
    }
    
    echo "\n" . str_repeat('-', 60) . "\n";
    echo sprintf("TOTAL: Checked %d files, Removed %d files\n", $totalChecked, $totalRemoved);
    echo sprintf("Total disk space freed: %s\n", formatBytes($stats['total_size_freed']));
    
    if ($config['dry_run']) {
        echo "\n[DRY RUN MODE] No files were actually deleted.\n";
        echo "Run without --dry-run to perform actual cleanup.\n";
    }
    
    echo "\nCleanup completed at " . date('Y-m-d H:i:s') . "\n";
}

/**
 * Show help message
 */
function showHelp() {
    echo <<<HELP
Temporary Files Cleanup Script

Usage: php cleanup-temp.php [options]

Options:
  --age-minutes=N   Remove temp_audio files older than N minutes (default: 30)
  --dry-run         Show what would be deleted without actually deleting
  --verbose         Show detailed output
  --help            Show this help message

Examples:
  php cleanup-temp.php
    Remove temp files older than 30 minutes
    
  php cleanup-temp.php --age-minutes=60 --dry-run
    Show what files would be removed if older than 60 minutes
    
  php cleanup-temp.php --verbose
    Show detailed output during cleanup

Cleanup targets:
  - temp_audio/*: Audio files older than --age-minutes
  - Logs: Files older than 7 days
  - Sessions: Orphaned sessions older than 24 hours
  - Cache: Expired cache files older than 12 hours
  - Rate limits: Expired rate limit files older than 1 minute

HELP;
}