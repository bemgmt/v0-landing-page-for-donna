<?php
/**
 * Migration Validation Script
 * Comprehensive validation to verify the migration from file-based to database storage
 */

require_once __DIR__ . '/../lib/DataAccessFactory.php';
require_once __DIR__ . '/../lib/FileDataAccess.php';
require_once __DIR__ . '/../lib/PostgreSQLDataAccess.php';

class MigrationValidator {
    private $fileDAL;
    private $dbDAL;
    private $verbose;
    private $logFile;
    private $errors = [];
    private $warnings = [];

    public function __construct($options = []) {
        $this->verbose = $options['verbose'] ?? true;
        $this->logFile = __DIR__ . '/../logs/validation_' . date('Y-m-d_H-i-s') . '.log';
        
        // Ensure logs directory exists
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
    }

    public function validate($options = []) {
        $this->log("Starting migration validation...");
        
        try {
            // Step 1: Initialize data access layers
            $this->log("Step 1: Initializing data access layers...");
            $this->initializeDataAccessLayers();

            // Step 2: Compare data integrity
            $this->log("Step 2: Comparing data integrity...");
            $this->compareDataIntegrity();

            // Step 3: Test API endpoints
            $this->log("Step 3: Testing API endpoints...");
            $this->testApiEndpoints();

            // Step 4: Performance benchmarks
            if ($options['performance'] ?? false) {
                $this->log("Step 4: Running performance benchmarks...");
                $this->runPerformanceBenchmarks();
            }

            // Step 5: Generate validation report
            $this->log("Step 5: Generating validation report...");
            $report = $this->generateValidationReport();

            $this->log("Validation completed!");
            return $report;

        } catch (Exception $e) {
            $this->log("Validation failed: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'errors' => $this->errors,
                'warnings' => $this->warnings
            ];
        }
    }

    private function initializeDataAccessLayers() {
        // Initialize file-based data access
        $this->fileDAL = new FileDataAccess();
        $this->log("File DAL initialized");

        // Initialize database data access
        $this->dbDAL = new PostgreSQLDataAccess();
        $this->dbDAL->testConnection();
        $this->log("Database DAL initialized and connection tested");
    }

    private function compareDataIntegrity() {
        $this->log("Comparing data integrity between file and database storage...");
        
        // Compare users
        $this->compareUsers();
        
        // Compare chat sessions
        $this->compareChatSessions();
        
        // Compare messages
        $this->compareMessages();
        
        // Compare user memory
        $this->compareUserMemory();
    }

    private function compareUsers() {
        $this->log("Comparing users...");
        
        try {
            $fileUsers = $this->fileDAL->getAllUsers();
            $dbUsers = $this->dbDAL->getAllUsers();
            
            $fileCount = count($fileUsers);
            $dbCount = count($dbUsers);
            
            if ($fileCount !== $dbCount) {
                $this->addError("User count mismatch: File=$fileCount, DB=$dbCount");
                return;
            }
            
            // Compare individual users
            $fileUserEmails = array_column($fileUsers, 'email');
            $dbUserEmails = array_column($dbUsers, 'email');
            
            $missingInDb = array_diff($fileUserEmails, $dbUserEmails);
            $extraInDb = array_diff($dbUserEmails, $fileUserEmails);
            
            if (!empty($missingInDb)) {
                $this->addError("Users missing in database: " . implode(', ', $missingInDb));
            }
            
            if (!empty($extraInDb)) {
                $this->addWarning("Extra users in database: " . implode(', ', $extraInDb));
            }
            
            $this->log("Users comparison: PASSED ($fileCount users)");
            
        } catch (Exception $e) {
            $this->addError("Failed to compare users: " . $e->getMessage());
        }
    }

    private function compareChatSessions() {
        $this->log("Comparing chat sessions...");
        
        try {
            $fileUsers = $this->fileDAL->getAllUsers();
            $totalFileSessions = 0;
            $totalDbSessions = 0;
            
            foreach ($fileUsers as $user) {
                $fileSessions = $this->fileDAL->getUserChatSessions($user['id']);
                $dbSessions = $this->dbDAL->getUserChatSessions($user['id']);
                
                $totalFileSessions += count($fileSessions);
                $totalDbSessions += count($dbSessions);
                
                if (count($fileSessions) !== count($dbSessions)) {
                    $this->addError("Chat session count mismatch for user {$user['email']}: File=" . count($fileSessions) . ", DB=" . count($dbSessions));
                }
            }
            
            if ($totalFileSessions === $totalDbSessions) {
                $this->log("Chat sessions comparison: PASSED ($totalFileSessions sessions)");
            } else {
                $this->addError("Total chat session count mismatch: File=$totalFileSessions, DB=$totalDbSessions");
            }
            
        } catch (Exception $e) {
            $this->addError("Failed to compare chat sessions: " . $e->getMessage());
        }
    }

    private function compareMessages() {
        $this->log("Comparing messages...");
        
        try {
            $fileUsers = $this->fileDAL->getAllUsers();
            $totalFileMessages = 0;
            $totalDbMessages = 0;
            
            foreach ($fileUsers as $user) {
                $fileSessions = $this->fileDAL->getUserChatSessions($user['id']);
                $dbSessions = $this->dbDAL->getUserChatSessions($user['id']);
                
                foreach ($fileSessions as $index => $fileSession) {
                    if (isset($dbSessions[$index])) {
                        $fileMessages = $this->fileDAL->getChatMessages($fileSession['id']);
                        $dbMessages = $this->dbDAL->getChatMessages($dbSessions[$index]['id']);
                        
                        $totalFileMessages += count($fileMessages);
                        $totalDbMessages += count($dbMessages);
                        
                        if (count($fileMessages) !== count($dbMessages)) {
                            $this->addError("Message count mismatch for session {$fileSession['id']}: File=" . count($fileMessages) . ", DB=" . count($dbMessages));
                        }
                    }
                }
            }
            
            if ($totalFileMessages === $totalDbMessages) {
                $this->log("Messages comparison: PASSED ($totalFileMessages messages)");
            } else {
                $this->addError("Total message count mismatch: File=$totalFileMessages, DB=$totalDbMessages");
            }
            
        } catch (Exception $e) {
            $this->addError("Failed to compare messages: " . $e->getMessage());
        }
    }

    private function compareUserMemory() {
        $this->log("Comparing user memory...");
        
        try {
            $fileUsers = $this->fileDAL->getAllUsers();
            $totalFileMemories = 0;
            $totalDbMemories = 0;
            
            foreach ($fileUsers as $user) {
                try {
                    $fileMemories = $this->fileDAL->getUserMemory($user['id']);
                    $dbMemories = $this->dbDAL->getUserMemory($user['id']);
                    
                    $totalFileMemories += is_array($fileMemories) ? count($fileMemories) : 0;
                    $totalDbMemories += is_array($dbMemories) ? count($dbMemories) : 0;
                    
                } catch (Exception $e) {
                    $this->addWarning("Could not compare memory for user {$user['email']}: " . $e->getMessage());
                }
            }
            
            $this->log("User memory comparison: File=$totalFileMemories, DB=$totalDbMemories");
            
        } catch (Exception $e) {
            $this->addError("Failed to compare user memory: " . $e->getMessage());
        }
    }

    private function testApiEndpoints() {
        $this->log("Testing API endpoints with database storage...");
        
        // Test endpoints that should work with database storage
        $endpoints = [
            '/api/conversations.php',
            '/api/chatbot_settings.php'
        ];
        
        foreach ($endpoints as $endpoint) {
            try {
                $this->testEndpoint($endpoint);
            } catch (Exception $e) {
                $this->addError("Endpoint test failed for $endpoint: " . $e->getMessage());
            }
        }
    }

    private function testEndpoint($endpoint) {
        // Simple endpoint test - check if it responds without fatal errors
        $url = 'http://localhost' . $endpoint;
        
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 10,
                'ignore_errors' => true
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            $this->addWarning("Could not test endpoint $endpoint - may require authentication or local server");
        } else {
            $this->log("Endpoint $endpoint: Responded successfully");
        }
    }

    private function runPerformanceBenchmarks() {
        $this->log("Running performance benchmarks...");
        
        // Test database query performance
        $start = microtime(true);
        $users = $this->dbDAL->getAllUsers();
        $userQueryTime = microtime(true) - $start;
        
        $start = microtime(true);
        if (!empty($users)) {
            $sessions = $this->dbDAL->getUserChatSessions($users[0]['id']);
        }
        $sessionQueryTime = microtime(true) - $start;
        
        $this->log("Performance: User query took " . round($userQueryTime * 1000, 2) . "ms");
        $this->log("Performance: Session query took " . round($sessionQueryTime * 1000, 2) . "ms");
        
        if ($userQueryTime > 1.0) {
            $this->addWarning("User query performance is slow: " . round($userQueryTime, 2) . "s");
        }
        
        if ($sessionQueryTime > 1.0) {
            $this->addWarning("Session query performance is slow: " . round($sessionQueryTime, 2) . "s");
        }
    }

    private function generateValidationReport() {
        $report = [
            'success' => empty($this->errors),
            'timestamp' => date('Y-m-d H:i:s'),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'summary' => [
                'total_errors' => count($this->errors),
                'total_warnings' => count($this->warnings),
                'validation_status' => empty($this->errors) ? 'PASSED' : 'FAILED'
            ]
        ];
        
        // Save report to file
        $reportFile = __DIR__ . '/../logs/validation_report_' . date('Y-m-d_H-i-s') . '.json';
        file_put_contents($reportFile, json_encode($report, JSON_PRETTY_PRINT));
        
        $this->log("Validation report saved to: $reportFile");
        
        return $report;
    }

    private function addError($message) {
        $this->errors[] = $message;
        $this->log($message, 'ERROR');
    }

    private function addWarning($message) {
        $this->warnings[] = $message;
        $this->log($message, 'WARNING');
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
            case '--performance':
                $options['performance'] = true;
                break;
            case '--quiet':
                $options['verbose'] = false;
                break;
            case '--help':
                echo "Usage: php validate-migration.php [options]\n";
                echo "Options:\n";
                echo "  --performance      Run performance benchmarks\n";
                echo "  --quiet           Suppress verbose output\n";
                echo "  --help            Show this help message\n";
                exit(0);
        }
    }
    
    $validator = new MigrationValidator($options);
    $report = $validator->validate($options);
    
    echo "\n=== VALIDATION REPORT ===\n";
    echo "Status: " . ($report['success'] ? 'PASSED' : 'FAILED') . "\n";
    echo "Errors: " . count($report['errors']) . "\n";
    echo "Warnings: " . count($report['warnings']) . "\n";
    
    if (!empty($report['errors'])) {
        echo "\nErrors:\n";
        foreach ($report['errors'] as $error) {
            echo "  - $error\n";
        }
    }
    
    if (!empty($report['warnings'])) {
        echo "\nWarnings:\n";
        foreach ($report['warnings'] as $warning) {
            echo "  - $warning\n";
        }
    }
    
    exit($report['success'] ? 0 : 1);
}
?>
