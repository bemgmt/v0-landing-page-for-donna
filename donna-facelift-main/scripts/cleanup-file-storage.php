<?php
/**
 * File Storage Cleanup Script
 * Safely removes file-based storage after successful migration to database
 */

class FileStorageCleanup {
    private $verbose;
    private $dryRun;
    private $archiveMode;
    private $logFile;
    private $backupDir;

    public function __construct($options = []) {
        $this->verbose = $options['verbose'] ?? true;
        $this->dryRun = $options['dry_run'] ?? false;
        $this->archiveMode = $options['archive'] ?? false;
        $this->logFile = __DIR__ . '/../logs/cleanup_' . date('Y-m-d_H-i-s') . '.log';
        $this->backupDir = __DIR__ . '/../backups/file_storage_' . date('Y-m-d_H-i-s');
        
        // Ensure directories exist
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
        
        if ($this->archiveMode && !is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }

    public function cleanup($options = []) {
        $this->log("Starting file storage cleanup...");
        
        try {
            // Step 1: Safety checks
            $this->log("Step 1: Running safety checks...");
            if (!$this->runSafetyChecks()) {
                throw new Exception("Safety checks failed - aborting cleanup");
            }

            // Step 2: Archive data if requested
            if ($this->archiveMode) {
                $this->log("Step 2: Archiving file-based data...");
                $this->archiveFileData();
            }

            // Step 3: Clean up file storage
            if (!$this->dryRun) {
                $this->log("Step 3: Cleaning up file storage...");
                $this->cleanupFileStorage();
            } else {
                $this->log("Step 3: DRY RUN - Would clean up file storage");
                $this->simulateCleanup();
            }

            // Step 4: Update configuration
            if (!$this->dryRun) {
                $this->log("Step 4: Updating configuration...");
                $this->updateConfiguration();
            }

            $this->log("File storage cleanup completed successfully!");
            return true;

        } catch (Exception $e) {
            $this->log("Cleanup failed: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    private function runSafetyChecks() {
        $this->log("Running safety checks...");
        
        // Check if database storage is working
        try {
            require_once __DIR__ . '/../lib/DataAccessFactory.php';
            $dal = DataAccessFactory::create();
            
            if (DataAccessFactory::isFileStorage()) {
                $this->log("WARNING: Current storage type is still 'file'. Consider switching to database storage first.", 'WARNING');
                return false;
            }
            
            // Test database connectivity
            $dal->testConnection();
            $this->log("Database connectivity: OK");
            
            // Test basic operations
            $users = $dal->getAllUsers();
            $this->log("Database operations: OK (found " . count($users) . " users)");
            
        } catch (Exception $e) {
            $this->log("Database safety check failed: " . $e->getMessage(), 'ERROR');
            return false;
        }
        
        // Check if file storage directories exist
        $fileStorageDirs = [
            __DIR__ . '/../data/users',
            __DIR__ . '/../data/chat_sessions',
            __DIR__ . '/../data/memory',
            __DIR__ . '/../mcp/storage',
            __DIR__ . '/../logs'
        ];
        
        $existingDirs = [];
        foreach ($fileStorageDirs as $dir) {
            if (is_dir($dir)) {
                $existingDirs[] = $dir;
            }
        }
        
        if (empty($existingDirs)) {
            $this->log("No file storage directories found - nothing to clean up");
            return false;
        }
        
        $this->log("Found " . count($existingDirs) . " file storage directories to process");
        
        return true;
    }

    private function archiveFileData() {
        $this->log("Archiving file-based data to: " . $this->backupDir);
        
        $sourceDirectories = [
            'data' => __DIR__ . '/../data',
            'mcp_storage' => __DIR__ . '/../mcp/storage',
            'logs' => __DIR__ . '/../logs'
        ];
        
        foreach ($sourceDirectories as $name => $sourceDir) {
            if (is_dir($sourceDir)) {
                $targetDir = $this->backupDir . '/' . $name;
                $this->copyDirectory($sourceDir, $targetDir);
                $this->log("Archived $name directory");
            }
        }
        
        // Create archive metadata
        $metadata = [
            'archive_date' => date('Y-m-d H:i:s'),
            'source_directories' => $sourceDirectories,
            'archive_reason' => 'Database migration cleanup',
            'original_storage_type' => 'file',
            'new_storage_type' => $_ENV['DATA_STORAGE_TYPE'] ?? 'postgresql'
        ];
        
        file_put_contents($this->backupDir . '/archive_metadata.json', json_encode($metadata, JSON_PRETTY_PRINT));
        $this->log("Archive metadata saved");
    }

    private function cleanupFileStorage() {
        $this->log("Cleaning up file storage directories...");
        
        $directoriesToClean = [
            __DIR__ . '/../data/users',
            __DIR__ . '/../data/chat_sessions',
            __DIR__ . '/../data/memory',
            __DIR__ . '/../data/chatbot_settings.json',
            __DIR__ . '/../mcp/storage/sessions',
            __DIR__ . '/../mcp/storage/conversations',
            __DIR__ . '/../mcp/storage/oauth2_token.json'
        ];
        
        foreach ($directoriesToClean as $path) {
            if (is_dir($path)) {
                $this->removeDirectory($path);
                $this->log("Removed directory: $path");
            } elseif (is_file($path)) {
                unlink($path);
                $this->log("Removed file: $path");
            }
        }
        
        // Clean up empty parent directories
        $parentDirs = [
            __DIR__ . '/../data',
            __DIR__ . '/../mcp/storage'
        ];
        
        foreach ($parentDirs as $dir) {
            if (is_dir($dir) && $this->isDirectoryEmpty($dir)) {
                rmdir($dir);
                $this->log("Removed empty directory: $dir");
            }
        }
    }

    private function simulateCleanup() {
        $this->log("=== DRY RUN - Simulating cleanup ===");
        
        $directoriesToClean = [
            __DIR__ . '/../data/users',
            __DIR__ . '/../data/chat_sessions',
            __DIR__ . '/../data/memory',
            __DIR__ . '/../data/chatbot_settings.json',
            __DIR__ . '/../mcp/storage/sessions',
            __DIR__ . '/../mcp/storage/conversations',
            __DIR__ . '/../mcp/storage/oauth2_token.json'
        ];
        
        foreach ($directoriesToClean as $path) {
            if (is_dir($path)) {
                $fileCount = $this->countFilesInDirectory($path);
                $this->log("Would remove directory: $path ($fileCount files)");
            } elseif (is_file($path)) {
                $this->log("Would remove file: $path");
            }
        }
    }

    private function updateConfiguration() {
        $this->log("Updating configuration files...");
        
        // Update .env file if it exists
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $envContent = file_get_contents($envFile);
            
            // Ensure DATA_STORAGE_TYPE is not set to 'file'
            if (strpos($envContent, 'DATA_STORAGE_TYPE=file') !== false) {
                $envContent = str_replace('DATA_STORAGE_TYPE=file', 'DATA_STORAGE_TYPE=postgresql', $envContent);
                file_put_contents($envFile, $envContent);
                $this->log("Updated .env file to use database storage");
            }
        }
        
        // Create cleanup completion marker
        $completionMarker = __DIR__ . '/../.file_storage_cleaned';
        file_put_contents($completionMarker, json_encode([
            'cleanup_date' => date('Y-m-d H:i:s'),
            'archived' => $this->archiveMode,
            'archive_location' => $this->archiveMode ? $this->backupDir : null
        ], JSON_PRETTY_PRINT));
        
        $this->log("Created cleanup completion marker");
    }

    private function copyDirectory($source, $destination) {
        if (!is_dir($destination)) {
            mkdir($destination, 0755, true);
        }
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $item) {
            $target = $destination . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
            
            if ($item->isDir()) {
                if (!is_dir($target)) {
                    mkdir($target, 0755, true);
                }
            } else {
                copy($item, $target);
            }
        }
    }

    private function removeDirectory($directory) {
        if (!is_dir($directory)) {
            return;
        }
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        
        foreach ($iterator as $item) {
            if ($item->isDir()) {
                rmdir($item->getRealPath());
            } else {
                unlink($item->getRealPath());
            }
        }
        
        rmdir($directory);
    }

    private function isDirectoryEmpty($directory) {
        $handle = opendir($directory);
        while (false !== ($entry = readdir($handle))) {
            if ($entry != "." && $entry != "..") {
                closedir($handle);
                return false;
            }
        }
        closedir($handle);
        return true;
    }

    private function countFilesInDirectory($directory) {
        if (!is_dir($directory)) {
            return 0;
        }
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        return iterator_count($iterator);
    }

    private function log($message, $level = 'INFO') {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        
        // Write to log file
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Also output to console if verbose
        if ($this->verbose) {
            echo $logEntry;
        }
    }
}

// CLI execution
if (php_sapi_name() === 'cli') {
    $options = [];
    
    // Parse command line arguments
    for ($i = 1; $i < $argc; $i++) {
        switch ($argv[$i]) {
            case '--dry-run':
                $options['dry_run'] = true;
                break;
            case '--archive':
                $options['archive'] = true;
                break;
            case '--quiet':
                $options['verbose'] = false;
                break;
            case '--help':
                echo "Usage: php cleanup-file-storage.php [options]\n";
                echo "Options:\n";
                echo "  --dry-run          Show what would be cleaned up without actually doing it\n";
                echo "  --archive          Archive file data before cleanup\n";
                echo "  --quiet            Suppress verbose output\n";
                echo "  --help             Show this help message\n";
                echo "\nWARNING: This script will permanently delete file-based storage.\n";
                echo "Make sure you have successfully migrated to database storage first!\n";
                exit(0);
        }
    }
    
    // Confirmation prompt for destructive operations
    if (!($options['dry_run'] ?? false)) {
        echo "WARNING: This will permanently delete file-based storage data.\n";
        echo "Make sure you have:\n";
        echo "1. Successfully migrated to database storage\n";
        echo "2. Validated the migration\n";
        echo "3. Tested the application with database storage\n";
        echo "\nDo you want to continue? (yes/no): ";
        
        $handle = fopen("php://stdin", "r");
        $confirmation = trim(fgets($handle));
        fclose($handle);
        
        if (strtolower($confirmation) !== 'yes') {
            echo "Cleanup cancelled.\n";
            exit(0);
        }
    }
    
    $cleanup = new FileStorageCleanup($options);
    $success = $cleanup->cleanup($options);
    
    exit($success ? 0 : 1);
}
?>
