<?php
/**
 * WS4 Task 3: Runtime Data Retention and Cleanup Manager
 * 
 * Manages retention policies for temp audio, chat histories, memory snapshots
 * Integrates with LogManager for comprehensive data lifecycle management
 */

require_once __DIR__ . '/LogManager.php';

class DataRetentionManager {
    private $config;
    private $logManager;
    
    // Default retention periods (in seconds)
    const DEFAULT_RETENTION = [
        'temp_audio' => 3600,        // 1 hour
        'chat_sessions' => 2592000,  // 30 days
        'user_memory' => 7776000,    // 90 days
        'logs' => 604800,            // 7 days
        'cache' => 86400,            // 1 day
        'temp_files' => 1800         // 30 minutes
    ];
    
    public function __construct($config = []) {
        $this->config = array_merge(self::DEFAULT_RETENTION, $config);
        $this->logManager = new LogManager();
    }
    
    /**
     * Run comprehensive cleanup of all data types
     */
    public function runCleanup($dryRun = false) {
        $results = [
            'temp_audio' => $this->cleanupTempAudio($dryRun),
            'chat_sessions' => $this->cleanupChatSessions($dryRun),
            'user_memory' => $this->cleanupUserMemory($dryRun),
            'logs' => $this->cleanupLogs($dryRun),
            'cache' => $this->cleanupCache($dryRun),
            'temp_files' => $this->cleanupTempFiles($dryRun)
        ];
        
        // Log cleanup summary
        $totalCleaned = array_sum(array_column($results, 'files_cleaned'));
        $totalSize = array_sum(array_column($results, 'size_freed'));
        
        $this->logManager->info('Data retention cleanup completed', [
            'dry_run' => $dryRun,
            'total_files_cleaned' => $totalCleaned,
            'total_size_freed_mb' => round($totalSize / 1024 / 1024, 2),
            'results' => $results
        ]);
        
        return $results;
    }
    
    /**
     * Cleanup temporary audio files
     */
    public function cleanupTempAudio($dryRun = false) {
        $audioDirs = [
            __DIR__ . '/../voice_system/temp_audio',
            __DIR__ . '/../temp_audio',
            __DIR__ . '/../data/temp_audio'
        ];
        
        $cleaned = 0;
        $sizeFreed = 0;
        $maxAge = $this->config['temp_audio'];
        
        foreach ($audioDirs as $dir) {
            if (!is_dir($dir)) continue;
            
            $files = glob($dir . '/*');
            foreach ($files as $file) {
                if (!is_file($file)) continue;
                
                $age = time() - filemtime($file);
                if ($age > $maxAge) {
                    $size = filesize($file);
                    
                    if (!$dryRun) {
                        if (unlink($file)) {
                            $cleaned++;
                            $sizeFreed += $size;
                        }
                    } else {
                        $cleaned++;
                        $sizeFreed += $size;
                    }
                }
            }
        }
        
        return [
            'files_cleaned' => $cleaned,
            'size_freed' => $sizeFreed,
            'max_age_seconds' => $maxAge
        ];
    }
    
    /**
     * Cleanup old chat sessions
     */
    public function cleanupChatSessions($dryRun = false) {
        $chatDir = __DIR__ . '/../data/chat_sessions';
        if (!is_dir($chatDir)) {
            return ['files_cleaned' => 0, 'size_freed' => 0, 'max_age_seconds' => $this->config['chat_sessions']];
        }
        
        $cleaned = 0;
        $sizeFreed = 0;
        $maxAge = $this->config['chat_sessions'];
        
        $files = glob($chatDir . '/*.json');
        foreach ($files as $file) {
            $age = time() - filemtime($file);
            if ($age > $maxAge) {
                $size = filesize($file);
                
                if (!$dryRun) {
                    if (unlink($file)) {
                        $cleaned++;
                        $sizeFreed += $size;
                    }
                } else {
                    $cleaned++;
                    $sizeFreed += $size;
                }
            }
        }
        
        return [
            'files_cleaned' => $cleaned,
            'size_freed' => $sizeFreed,
            'max_age_seconds' => $maxAge
        ];
    }
    
    /**
     * Cleanup old user memory snapshots
     */
    public function cleanupUserMemory($dryRun = false) {
        $memoryDir = __DIR__ . '/../data/memory';
        if (!is_dir($memoryDir)) {
            return ['files_cleaned' => 0, 'size_freed' => 0, 'max_age_seconds' => $this->config['user_memory']];
        }
        
        $cleaned = 0;
        $sizeFreed = 0;
        $maxAge = $this->config['user_memory'];
        
        $files = glob($memoryDir . '/*.json');
        foreach ($files as $file) {
            $age = time() - filemtime($file);
            if ($age > $maxAge) {
                $size = filesize($file);
                
                if (!$dryRun) {
                    if (unlink($file)) {
                        $cleaned++;
                        $sizeFreed += $size;
                    }
                } else {
                    $cleaned++;
                    $sizeFreed += $size;
                }
            }
        }
        
        return [
            'files_cleaned' => $cleaned,
            'size_freed' => $sizeFreed,
            'max_age_seconds' => $maxAge
        ];
    }
    
    /**
     * Cleanup old log files (delegates to LogManager)
     */
    public function cleanupLogs($dryRun = false) {
        // LogManager handles its own rotation and cleanup
        // We just trigger it and report results
        $logDir = $this->logManager->getLogDir();
        
        if (!is_dir($logDir)) {
            return ['files_cleaned' => 0, 'size_freed' => 0, 'max_age_seconds' => $this->config['logs']];
        }
        
        $beforeFiles = glob($logDir . '/*');
        $beforeCount = count($beforeFiles);
        $beforeSize = array_sum(array_map('filesize', array_filter($beforeFiles, 'is_file')));
        
        if (!$dryRun) {
            // Trigger log rotation and cleanup
            $this->logManager->rotateIfNeeded();
            $this->logManager->cleanupOldLogs($this->config['logs']);
        }
        
        $afterFiles = glob($logDir . '/*');
        $afterCount = count($afterFiles);
        $afterSize = array_sum(array_map('filesize', array_filter($afterFiles, 'is_file')));
        
        return [
            'files_cleaned' => $beforeCount - $afterCount,
            'size_freed' => $beforeSize - $afterSize,
            'max_age_seconds' => $this->config['logs']
        ];
    }
    
    /**
     * Cleanup cache files
     */
    public function cleanupCache($dryRun = false) {
        $cacheDirs = [
            __DIR__ . '/../cache',
            __DIR__ . '/../data/cache'
        ];
        
        $cleaned = 0;
        $sizeFreed = 0;
        $maxAge = $this->config['cache'];
        
        foreach ($cacheDirs as $dir) {
            if (!is_dir($dir)) continue;
            
            $files = glob($dir . '/*');
            foreach ($files as $file) {
                if (!is_file($file)) continue;
                
                $age = time() - filemtime($file);
                if ($age > $maxAge) {
                    $size = filesize($file);
                    
                    if (!$dryRun) {
                        if (unlink($file)) {
                            $cleaned++;
                            $sizeFreed += $size;
                        }
                    } else {
                        $cleaned++;
                        $sizeFreed += $size;
                    }
                }
            }
        }
        
        return [
            'files_cleaned' => $cleaned,
            'size_freed' => $sizeFreed,
            'max_age_seconds' => $maxAge
        ];
    }
    
    /**
     * Cleanup temporary files
     */
    public function cleanupTempFiles($dryRun = false) {
        $tempPatterns = [
            __DIR__ . '/../*.tmp',
            __DIR__ . '/../*.temp',
            __DIR__ . '/../*.bak',
            __DIR__ . '/../*.swp',
            __DIR__ . '/../*~'
        ];
        
        $cleaned = 0;
        $sizeFreed = 0;
        $maxAge = $this->config['temp_files'];
        
        foreach ($tempPatterns as $pattern) {
            $files = glob($pattern);
            foreach ($files as $file) {
                if (!is_file($file)) continue;
                
                $age = time() - filemtime($file);
                if ($age > $maxAge) {
                    $size = filesize($file);
                    
                    if (!$dryRun) {
                        if (unlink($file)) {
                            $cleaned++;
                            $sizeFreed += $size;
                        }
                    } else {
                        $cleaned++;
                        $sizeFreed += $size;
                    }
                }
            }
        }
        
        return [
            'files_cleaned' => $cleaned,
            'size_freed' => $sizeFreed,
            'max_age_seconds' => $maxAge
        ];
    }
    
    /**
     * Get retention policy configuration
     */
    public function getRetentionConfig() {
        return $this->config;
    }
    
    /**
     * Update retention policy for a specific data type
     */
    public function setRetentionPolicy($dataType, $seconds) {
        if (array_key_exists($dataType, $this->config)) {
            $this->config[$dataType] = $seconds;
            return true;
        }
        return false;
    }
    
    /**
     * Get storage usage statistics
     */
    public function getStorageStats() {
        $stats = [];
        
        $dataDirs = [
            'temp_audio' => [__DIR__ . '/../voice_system/temp_audio', __DIR__ . '/../temp_audio'],
            'chat_sessions' => [__DIR__ . '/../data/chat_sessions'],
            'user_memory' => [__DIR__ . '/../data/memory'],
            'logs' => [$this->logManager->getLogDir()],
            'cache' => [__DIR__ . '/../cache', __DIR__ . '/../data/cache']
        ];
        
        foreach ($dataDirs as $type => $dirs) {
            $totalSize = 0;
            $totalFiles = 0;
            
            foreach ($dirs as $dir) {
                if (is_dir($dir)) {
                    $files = glob($dir . '/*');
                    $files = array_filter($files, 'is_file');
                    $totalFiles += count($files);
                    $totalSize += array_sum(array_map('filesize', $files));
                }
            }
            
            $stats[$type] = [
                'files' => $totalFiles,
                'size_bytes' => $totalSize,
                'size_mb' => round($totalSize / 1024 / 1024, 2),
                'retention_seconds' => $this->config[$type] ?? 0
            ];
        }
        
        return $stats;
    }
}
