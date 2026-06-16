<?php
/**
 * File I/O Optimization Utility
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Phase 5 Task 5.2: File I/O optimization implementation
 * 
 * Implements batch writes, lazy loading, and temp file cleanup
 */

require_once __DIR__ . '/logging_helpers.php';

class FileIOOptimizer {
    
    private $batchQueue = [];
    private $batchSize;
    private $lazyLoadCache = [];
    private $tempFilePatterns = [];
    private $metrics;
    
    public function __construct(int $batchSize = 10) {
        $this->batchSize = $batchSize;
        $this->metrics = new FileIOMetrics();
        $this->initializeTempFilePatterns();
    }
    
    // ========================================
    // Batch Write Operations
    // ========================================
    
    /**
     * Queue a write operation for batching
     */
    public function queueWrite(string $filePath, mixed $data, string $operation = 'write'): void {
        $this->batchQueue[] = [
            'file_path' => $filePath,
            'data' => $data,
            'operation' => $operation,
            'timestamp' => microtime(true)
        ];
        
        // Auto-flush if batch size reached
        if (count($this->batchQueue) >= $this->batchSize) {
            $this->flushBatch();
        }
    }
    
    /**
     * Queue JSON write operation
     */
    public function queueJsonWrite(string $filePath, array $data): void {
        $this->queueWrite($filePath, $data, 'json');
    }
    
    /**
     * Queue append operation
     */
    public function queueAppend(string $filePath, string $data): void {
        $this->queueWrite($filePath, $data, 'append');
    }
    
    /**
     * Flush all queued write operations
     */
    public function flushBatch(): int {
        if (empty($this->batchQueue)) {
            return 0;
        }
        
        $startTime = microtime(true);
        $processed = 0;
        $errors = 0;
        
        // Group operations by file for efficiency
        $groupedOps = $this->groupOperationsByFile($this->batchQueue);
        
        foreach ($groupedOps as $filePath => $operations) {
            try {
                $this->processBatchedOperations($filePath, $operations);
                $processed += count($operations);
            } catch (Exception $e) {
                $errors++;
                log_error('Batch write failed', [
                    'file_path' => $filePath,
                    'operations_count' => count($operations),
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        $duration = microtime(true) - $startTime;
        $this->metrics->recordBatchWrite($processed, $errors, $duration);
        
        // Clear the queue
        $this->batchQueue = [];
        
        log_info('Batch write completed', [
            'processed' => $processed,
            'errors' => $errors,
            'duration_ms' => round($duration * 1000, 2)
        ]);
        
        return $processed;
    }
    
    /**
     * Group operations by file path for efficient processing
     */
    private function groupOperationsByFile(array $operations): array {
        $grouped = [];
        
        foreach ($operations as $op) {
            $filePath = $op['file_path'];
            if (!isset($grouped[$filePath])) {
                $grouped[$filePath] = [];
            }
            $grouped[$filePath][] = $op;
        }
        
        return $grouped;
    }
    
    /**
     * Process batched operations for a single file
     */
    private function processBatchedOperations(string $filePath, array $operations): void {
        // Ensure directory exists
        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Sort operations by timestamp
        usort($operations, function($a, $b) {
            return $a['timestamp'] <=> $b['timestamp'];
        });
        
        // Process operations based on type
        $writeOps = array_filter($operations, fn($op) => in_array($op['operation'], ['write', 'json']));
        $appendOps = array_filter($operations, fn($op) => $op['operation'] === 'append');
        
        // Handle write operations (last one wins)
        if (!empty($writeOps)) {
            $lastWrite = end($writeOps);
            $this->executeWriteOperation($filePath, $lastWrite);
        }
        
        // Handle append operations (all of them)
        if (!empty($appendOps)) {
            $this->executeAppendOperations($filePath, $appendOps);
        }
    }
    
    /**
     * Execute a single write operation
     */
    private function executeWriteOperation(string $filePath, array $operation): void {
        $data = $operation['data'];
        
        if ($operation['operation'] === 'json') {
            $content = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        } else {
            $content = is_string($data) ? $data : serialize($data);
        }
        
        $result = file_put_contents($filePath, $content, LOCK_EX);
        if ($result === false) {
            throw new Exception("Failed to write to file: {$filePath}");
        }
        
        chmod($filePath, 0644);
    }
    
    /**
     * Execute multiple append operations
     */
    private function executeAppendOperations(string $filePath, array $operations): void {
        $content = '';
        foreach ($operations as $op) {
            $content .= $op['data'];
        }
        
        $result = file_put_contents($filePath, $content, FILE_APPEND | LOCK_EX);
        if ($result === false) {
            throw new Exception("Failed to append to file: {$filePath}");
        }
    }
    
    // ========================================
    // Lazy Loading Operations
    // ========================================
    
    /**
     * Lazy load file content with caching
     */
    public function lazyLoad(string $filePath, ?callable $processor = null): mixed {
        $cacheKey = md5($filePath);
        
        // Check if already cached
        if (isset($this->lazyLoadCache[$cacheKey])) {
            $cached = $this->lazyLoadCache[$cacheKey];
            
            // Check if file has been modified
            $currentMtime = filemtime($filePath);
            if ($currentMtime === $cached['mtime']) {
                $this->metrics->recordLazyLoadHit($filePath);
                return $cached['data'];
            }
        }
        
        // Load and cache the file
        $startTime = microtime(true);
        
        if (!file_exists($filePath)) {
            $this->metrics->recordLazyLoadMiss($filePath, 'not_found');
            return null;
        }
        
        $content = file_get_contents($filePath);
        if ($content === false) {
            $this->metrics->recordLazyLoadMiss($filePath, 'read_error');
            throw new Exception("Failed to read file: {$filePath}");
        }
        
        // Process content if processor provided
        $data = $processor ? $processor($content) : $content;
        
        // Cache the result
        $this->lazyLoadCache[$cacheKey] = [
            'data' => $data,
            'mtime' => filemtime($filePath),
            'cached_at' => time()
        ];
        
        $duration = microtime(true) - $startTime;
        $this->metrics->recordLazyLoadMiss($filePath, 'loaded', $duration);
        
        return $data;
    }
    
    /**
     * Lazy load JSON file
     */
    public function lazyLoadJson(string $filePath): ?array {
        return $this->lazyLoad($filePath, function($content) {
            $data = json_decode($content, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON in file: " . json_last_error_msg());
            }
            return $data;
        });
    }
    
    /**
     * Lazy load chat history with pagination
     */
    public function lazyLoadChatHistory(string $chatId, int $limit = 20, int $offset = 0): array {
        $historyFile = $this->getChatHistoryPath($chatId);
        
        $history = $this->lazyLoadJson($historyFile) ?: [];
        
        // Apply pagination
        $total = count($history);
        $history = array_reverse($history); // Most recent first
        $paginated = array_slice($history, $offset, $limit);
        
        return [
            'messages' => $paginated,
            'total' => $total,
            'offset' => $offset,
            'limit' => $limit,
            'has_more' => ($offset + $limit) < $total
        ];
    }
    
    /**
     * Clear lazy load cache
     */
    public function clearLazyCache(?string $filePath = null): void {
        if ($filePath) {
            $cacheKey = md5($filePath);
            unset($this->lazyLoadCache[$cacheKey]);
        } else {
            $this->lazyLoadCache = [];
        }
    }
    
    // ========================================
    // Temp File Cleanup
    // ========================================
    
    /**
     * Clean up temporary files
     */
    public function cleanupTempFiles(string $directory = null, int $maxAge = 3600): int {
        $directories = $directory ? [$directory] : $this->getDefaultTempDirectories();
        $cleaned = 0;
        $startTime = microtime(true);
        
        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                continue;
            }
            
            $cleaned += $this->cleanupDirectoryTempFiles($dir, $maxAge);
        }
        
        $duration = microtime(true) - $startTime;
        $this->metrics->recordTempCleanup($cleaned, $duration);
        
        log_info('Temp file cleanup completed', [
            'files_cleaned' => $cleaned,
            'duration_ms' => round($duration * 1000, 2)
        ]);
        
        return $cleaned;
    }
    
    /**
     * Clean up temp files in a specific directory
     */
    private function cleanupDirectoryTempFiles(string $directory, int $maxAge): int {
        $cleaned = 0;
        $cutoffTime = time() - $maxAge;
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }
            
            $filePath = $file->getPathname();
            $fileName = $file->getFilename();
            
            // Check if file matches temp patterns
            if (!$this->isTempFile($fileName, $filePath)) {
                continue;
            }
            
            // Check if file is old enough
            if ($file->getMTime() > $cutoffTime) {
                continue;
            }
            
            // Remove the file
            if (unlink($filePath)) {
                $cleaned++;
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Check if file is a temporary file
     */
    private function isTempFile(string $fileName, string $filePath): bool {
        foreach ($this->tempFilePatterns as $pattern) {
            if (fnmatch($pattern, $fileName) || fnmatch($pattern, $filePath)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Initialize temp file patterns
     */
    private function initializeTempFilePatterns(): void {
        $this->tempFilePatterns = [
            'tmp_*',
            'temp_*',
            '*.tmp',
            '*.temp',
            '.DS_Store',
            'Thumbs.db',
            '*.log.old',
            '*.bak',
            '*~',
            '*.swp',
            '*.swo',
            '.#*',
            '#*#',
            'core.*',
            '*.pid',
            '*.lock',
            'temp_audio/*',
            'voice_system/temp_audio/*',
            'generated_pages/*.html.tmp',
            'chat_history/*.tmp',
            'conversations/*.tmp'
        ];
    }
    
    /**
     * Get default temporary directories
     */
    private function getDefaultTempDirectories(): array {
        $baseDir = dirname(__DIR__);
        
        return [
            $baseDir . '/temp_audio',
            $baseDir . '/voice_system/temp_audio',
            $baseDir . '/generated_pages',
            $baseDir . '/logs',
            sys_get_temp_dir(),
            '/tmp'
        ];
    }
    
    // ========================================
    // Utility Methods
    // ========================================
    
    /**
     * Get chat history file path
     */
    private function getChatHistoryPath(string $chatId): string {
        $dataDir = dirname(__DIR__) . '/data/chat_sessions';
        return $dataDir . '/' . $chatId . '.json';
    }
    
    /**
     * Get optimization metrics
     */
    public function getMetrics(): array {
        return $this->metrics->getStats();
    }
    
    /**
     * Reset metrics
     */
    public function resetMetrics(): void {
        $this->metrics->reset();
    }
    
    /**
     * Get current batch queue size
     */
    public function getBatchQueueSize(): int {
        return count($this->batchQueue);
    }
    
    /**
     * Get lazy load cache statistics
     */
    public function getLazyCacheStats(): array {
        $totalSize = 0;
        $oldestEntry = time();
        $newestEntry = 0;
        
        foreach ($this->lazyLoadCache as $entry) {
            $totalSize += strlen(serialize($entry['data']));
            $oldestEntry = min($oldestEntry, $entry['cached_at']);
            $newestEntry = max($newestEntry, $entry['cached_at']);
        }
        
        return [
            'entries' => count($this->lazyLoadCache),
            'total_size_bytes' => $totalSize,
            'total_size_mb' => round($totalSize / 1024 / 1024, 2),
            'oldest_entry_age' => time() - $oldestEntry,
            'newest_entry_age' => time() - $newestEntry
        ];
    }
    
    /**
     * Destructor - flush any remaining batched operations
     */
    public function __destruct() {
        if (!empty($this->batchQueue)) {
            $this->flushBatch();
        }
    }
}

/**
 * File I/O Metrics Collector
 */
class FileIOMetrics {
    private $stats = [
        'batch_writes' => [
            'total_batches' => 0,
            'total_operations' => 0,
            'total_errors' => 0,
            'total_time' => 0.0
        ],
        'lazy_loads' => [
            'hits' => 0,
            'misses' => 0,
            'total_time' => 0.0,
            'files_loaded' => []
        ],
        'temp_cleanup' => [
            'total_runs' => 0,
            'total_files_cleaned' => 0,
            'total_time' => 0.0
        ],
        'start_time' => null
    ];

    public function __construct() {
        $this->stats['start_time'] = time();
    }

    public function recordBatchWrite(int $operations, int $errors, float $duration): void {
        $this->stats['batch_writes']['total_batches']++;
        $this->stats['batch_writes']['total_operations'] += $operations;
        $this->stats['batch_writes']['total_errors'] += $errors;
        $this->stats['batch_writes']['total_time'] += $duration;
    }

    public function recordLazyLoadHit(string $filePath): void {
        $this->stats['lazy_loads']['hits']++;
    }

    public function recordLazyLoadMiss(string $filePath, string $reason, float $duration = 0.0): void {
        $this->stats['lazy_loads']['misses']++;
        $this->stats['lazy_loads']['total_time'] += $duration;

        if ($reason === 'loaded') {
            $this->stats['lazy_loads']['files_loaded'][] = [
                'file' => basename($filePath),
                'timestamp' => time()
            ];
        }
    }

    public function recordTempCleanup(int $filesCleanedUp, float $duration): void {
        $this->stats['temp_cleanup']['total_runs']++;
        $this->stats['temp_cleanup']['total_files_cleaned'] += $filesCleanedUp;
        $this->stats['temp_cleanup']['total_time'] += $duration;
    }

    public function getStats(): array {
        $batchStats = $this->stats['batch_writes'];
        $lazyStats = $this->stats['lazy_loads'];
        $cleanupStats = $this->stats['temp_cleanup'];

        $totalLazyOps = $lazyStats['hits'] + $lazyStats['misses'];
        $lazyHitRate = $totalLazyOps > 0 ? ($lazyStats['hits'] / $totalLazyOps) * 100 : 0;
        $avgBatchTime = $batchStats['total_batches'] > 0 ? $batchStats['total_time'] / $batchStats['total_batches'] : 0;
        $avgLazyTime = $lazyStats['misses'] > 0 ? $lazyStats['total_time'] / $lazyStats['misses'] : 0;
        $avgCleanupTime = $cleanupStats['total_runs'] > 0 ? $cleanupStats['total_time'] / $cleanupStats['total_runs'] : 0;

        return [
            'batch_writes' => [
                'total_batches' => $batchStats['total_batches'],
                'total_operations' => $batchStats['total_operations'],
                'total_errors' => $batchStats['total_errors'],
                'avg_batch_time_ms' => round($avgBatchTime * 1000, 2),
                'error_rate_percent' => $batchStats['total_operations'] > 0 ?
                    round(($batchStats['total_errors'] / $batchStats['total_operations']) * 100, 2) : 0
            ],
            'lazy_loads' => [
                'hits' => $lazyStats['hits'],
                'misses' => $lazyStats['misses'],
                'hit_rate_percent' => round($lazyHitRate, 2),
                'avg_load_time_ms' => round($avgLazyTime * 1000, 2),
                'unique_files_loaded' => count($lazyStats['files_loaded'])
            ],
            'temp_cleanup' => [
                'total_runs' => $cleanupStats['total_runs'],
                'total_files_cleaned' => $cleanupStats['total_files_cleaned'],
                'avg_cleanup_time_ms' => round($avgCleanupTime * 1000, 2),
                'avg_files_per_run' => $cleanupStats['total_runs'] > 0 ?
                    round($cleanupStats['total_files_cleaned'] / $cleanupStats['total_runs'], 1) : 0
            ],
            'uptime_seconds' => time() - $this->stats['start_time']
        ];
    }

    public function reset(): void {
        $this->stats = [
            'batch_writes' => [
                'total_batches' => 0,
                'total_operations' => 0,
                'total_errors' => 0,
                'total_time' => 0.0
            ],
            'lazy_loads' => [
                'hits' => 0,
                'misses' => 0,
                'total_time' => 0.0,
                'files_loaded' => []
            ],
            'temp_cleanup' => [
                'total_runs' => 0,
                'total_files_cleaned' => 0,
                'total_time' => 0.0
            ],
            'start_time' => time()
        ];
    }
}
