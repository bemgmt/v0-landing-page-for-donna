<?php
/**
 * Comprehensive File to Database Migration Script
 * Uses the existing FileDataAccess::migrateTo() method to transfer all file-based data to PostgreSQL
 */

require_once __DIR__ . '/../lib/DataAccessFactory.php';
require_once __DIR__ . '/../lib/FileDataAccess.php';
require_once __DIR__ . '/../lib/PostgreSQLDataAccess.php';

class DatabaseMigrationScript {
    private $sourceDAL;
    private $targetDAL;
    private $logFile;
    private $dryRun;
    private $batchSize;
    private $verbose;

    public function __construct($options = []) {
        $this->dryRun = $options['dry_run'] ?? false;
        $this->batchSize = $options['batch_size'] ?? 100;
        $this->verbose = $options['verbose'] ?? true;
        $this->logFile = __DIR__ . '/../logs/migration_' . date('Y-m-d_H-i-s') . '.log';
        
        // Ensure logs directory exists
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }

    public function run($options = []) {
        $this->log("Starting database migration process...");
        
        try {
            // Step 1: Pre-migration checks
            $this->log("Step 1: Running pre-migration checks...");
            if (!$this->preMigrationChecks()) {
                throw new Exception("Pre-migration checks failed");
            }

            // Step 2: Initialize data access layers
            $this->log("Step 2: Initializing data access layers...");
            $this->initializeDataAccessLayers();

            // Step 3: Validate source data
            $this->log("Step 3: Validating source data...");
            $sourceStats = $this->validateSourceData();
            $this->log("Source data validation complete: " . json_encode($sourceStats));

            // Step 4: Execute migration
            if (!$this->dryRun) {
                $this->log("Step 4: Executing migration...");
                $this->executeMigration($options);
            } else {
                $this->log("Step 4: DRY RUN - Migration would transfer: " . json_encode($sourceStats));
            }

            // Step 5: Post-migration validation
            if (!$this->dryRun) {
                $this->log("Step 5: Running post-migration validation...");
                $this->postMigrationValidation($sourceStats);
            }

            $this->log("Migration completed successfully!");
            return true;

        } catch (Exception $e) {
            $this->log("Migration failed: " . $e->getMessage(), 'ERROR');
            if (!$this->dryRun) {
                $this->log("Consider running rollback procedures...", 'WARNING');
            }
            return false;
        }
    }

    private function preMigrationChecks() {
        // Check database connectivity
        try {
            $testDAL = new PostgreSQLDataAccess();
            $testDAL->testConnection();
            $this->log("Database connectivity: OK");
        } catch (Exception $e) {
            $this->log("Database connectivity failed: " . $e->getMessage(), 'ERROR');
            return false;
        }

        // Check file storage accessibility
        try {
            $testFileDAL = new FileDataAccess();
            if (!$testFileDAL->isInitialized()) {
                throw new Exception("File storage not properly initialized");
            }
            $this->log("File storage accessibility: OK");
        } catch (Exception $e) {
            $this->log("File storage check failed: " . $e->getMessage(), 'ERROR');
            return false;
        }

        // Check required environment variables
        $requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
        foreach ($requiredVars as $var) {
            if (empty($_ENV[$var])) {
                $this->log("Missing required environment variable: $var", 'ERROR');
                return false;
            }
        }
        $this->log("Environment variables: OK");

        return true;
    }

    private function initializeDataAccessLayers() {
        // Initialize source (file-based) data access
        $this->sourceDAL = new FileDataAccess();
        $this->log("Source DAL (FileDataAccess) initialized");

        // Initialize target (database) data access
        $this->targetDAL = new PostgreSQLDataAccess();
        $this->log("Target DAL (PostgreSQLDataAccess) initialized");
    }

    private function validateSourceData() {
        $stats = [
            'users' => 0,
            'chat_sessions' => 0,
            'messages' => 0,
            'user_memory' => 0,
            'oauth_tokens' => 0,
            'mcp_sessions' => 0
        ];

        // Count users
        try {
            $users = $this->sourceDAL->getAllUsers();
            $stats['users'] = count($users);
        } catch (Exception $e) {
            $this->log("Warning: Could not count users: " . $e->getMessage(), 'WARNING');
        }

        // Count chat sessions and messages
        try {
            $allSessions = [];
            $allMessages = [];
            
            foreach ($this->sourceDAL->getAllUsers() as $user) {
                $sessions = $this->sourceDAL->getUserChatSessions($user['id']);
                $allSessions = array_merge($allSessions, $sessions);
                
                foreach ($sessions as $session) {
                    $messages = $this->sourceDAL->getChatMessages($session['id']);
                    $allMessages = array_merge($allMessages, $messages);
                }
            }
            
            $stats['chat_sessions'] = count($allSessions);
            $stats['messages'] = count($allMessages);
        } catch (Exception $e) {
            $this->log("Warning: Could not count sessions/messages: " . $e->getMessage(), 'WARNING');
        }

        // Count user memory entries
        try {
            $memoryCount = 0;
            foreach ($this->sourceDAL->getAllUsers() as $user) {
                $memories = $this->sourceDAL->getUserMemory($user['id']);
                $memoryCount += count($memories);
            }
            $stats['user_memory'] = $memoryCount;
        } catch (Exception $e) {
            $this->log("Warning: Could not count user memory: " . $e->getMessage(), 'WARNING');
        }

        return $stats;
    }

    private function executeMigration($options = []) {
        $selectiveTypes = $options['types'] ?? ['users', 'chats', 'messages', 'memory'];
        
        $this->log("Executing migration for types: " . implode(', ', $selectiveTypes));
        
        // Use the built-in migrateTo method
        $result = $this->sourceDAL->migrateTo($this->targetDAL, [
            'batch_size' => $this->batchSize,
            'types' => $selectiveTypes,
            'progress_callback' => [$this, 'migrationProgressCallback']
        ]);

        if (!$result) {
            throw new Exception("Migration failed - migrateTo() returned false");
        }

        $this->log("Core data migration completed successfully");
    }

    public function migrationProgressCallback($type, $current, $total) {
        if ($this->verbose) {
            $percentage = $total > 0 ? round(($current / $total) * 100, 2) : 0;
            $this->log("Migrating $type: $current/$total ($percentage%)");
        }
    }

    private function postMigrationValidation($expectedStats) {
        $this->log("Validating migrated data...");
        
        // Validate users
        $migratedUsers = $this->targetDAL->getAllUsers();
        if (count($migratedUsers) !== $expectedStats['users']) {
            throw new Exception("User count mismatch: expected {$expectedStats['users']}, got " . count($migratedUsers));
        }
        $this->log("Users validation: PASSED (" . count($migratedUsers) . " records)");

        // Validate chat sessions and messages
        $totalSessions = 0;
        $totalMessages = 0;
        
        foreach ($migratedUsers as $user) {
            $sessions = $this->targetDAL->getUserChatSessions($user['id']);
            $totalSessions += count($sessions);
            
            foreach ($sessions as $session) {
                $messages = $this->targetDAL->getChatMessages($session['id']);
                $totalMessages += count($messages);
            }
        }

        if ($totalSessions !== $expectedStats['chat_sessions']) {
            throw new Exception("Chat sessions count mismatch: expected {$expectedStats['chat_sessions']}, got $totalSessions");
        }
        $this->log("Chat sessions validation: PASSED ($totalSessions records)");

        if ($totalMessages !== $expectedStats['messages']) {
            throw new Exception("Messages count mismatch: expected {$expectedStats['messages']}, got $totalMessages");
        }
        $this->log("Messages validation: PASSED ($totalMessages records)");

        $this->log("Post-migration validation completed successfully");
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
            case '--batch-size':
                $options['batch_size'] = intval($argv[++$i]);
                break;
            case '--quiet':
                $options['verbose'] = false;
                break;
            case '--types':
                $options['types'] = explode(',', $argv[++$i]);
                break;
            case '--help':
                echo "Usage: php migrate-file-to-database.php [options]\n";
                echo "Options:\n";
                echo "  --dry-run          Run validation only, don't migrate data\n";
                echo "  --batch-size N     Process N records at a time (default: 100)\n";
                echo "  --quiet            Suppress verbose output\n";
                echo "  --types TYPE1,TYPE2 Migrate only specific types (users,chats,messages,memory)\n";
                echo "  --help             Show this help message\n";
                exit(0);
        }
    }
    
    $migrator = new DatabaseMigrationScript($options);
    $success = $migrator->run($options);
    
    exit($success ? 0 : 1);
}
?>
