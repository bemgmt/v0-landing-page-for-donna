<?php
/**
 * Database Migration Test Suite
 * Comprehensive tests for the database migration process
 */

require_once __DIR__ . '/../../lib/DataAccessFactory.php';
require_once __DIR__ . '/../../lib/FileDataAccess.php';
require_once __DIR__ . '/../../lib/PostgreSQLDataAccess.php';

class DatabaseMigrationTest {
    private $testResults = [];
    private $testUserId = 'test_user_' . uniqid();
    private $testSessionId = null;
    private $testMessageId = null;

    public function runAllTests() {
        echo "Starting Database Migration Test Suite...\n\n";
        
        // Test 1: Data Access Factory
        $this->testDataAccessFactory();
        
        // Test 2: Database Connection
        $this->testDatabaseConnection();
        
        // Test 3: CRUD Operations
        $this->testCrudOperations();
        
        // Test 4: Migration Process
        $this->testMigrationProcess();
        
        // Test 5: Data Integrity
        $this->testDataIntegrity();
        
        // Test 6: Performance
        $this->testPerformance();
        
        // Test 7: Error Handling
        $this->testErrorHandling();
        
        // Test 8: Cleanup
        $this->testCleanup();
        
        $this->printResults();
        
        return $this->getOverallResult();
    }

    private function testDataAccessFactory() {
        $this->startTest("Data Access Factory");
        
        try {
            // Test factory creation with different storage types
            $fileDAL = DataAccessFactory::create('file');
            $this->assert($fileDAL instanceof FileDataAccess, "File DAL creation");
            
            $dbDAL = DataAccessFactory::create('postgresql');
            $this->assert($dbDAL instanceof PostgreSQLDataAccess, "PostgreSQL DAL creation");
            
            // Test default creation
            $defaultDAL = DataAccessFactory::create();
            $this->assert($defaultDAL !== null, "Default DAL creation");
            
            // Test health check
            $health = DataAccessFactory::getHealthCheck();
            $this->assert(isset($health['status']), "Health check returns status");
            
            $this->passTest("Data Access Factory");
            
        } catch (Exception $e) {
            $this->failTest("Data Access Factory", $e->getMessage());
        }
    }

    private function testDatabaseConnection() {
        $this->startTest("Database Connection");
        
        try {
            $dal = DataAccessFactory::create('postgresql');
            $dal->testConnection();
            
            $this->passTest("Database Connection");
            
        } catch (Exception $e) {
            $this->failTest("Database Connection", $e->getMessage());
        }
    }

    private function testCrudOperations() {
        $this->startTest("CRUD Operations");
        
        try {
            $dal = DataAccessFactory::create('postgresql');
            
            // Test user creation
            $user = $dal->createUser($this->testUserId . '@test.com', null, [
                'name' => 'Test User',
                'profile' => ['test' => true]
            ]);
            $this->assert($user !== null, "User creation");
            $this->assert($user['email'] === $this->testUserId . '@test.com', "User email correct");
            
            // Test user retrieval
            $retrievedUser = $dal->getUserByEmail($this->testUserId . '@test.com');
            $this->assert($retrievedUser !== null, "User retrieval");
            $this->assert($retrievedUser['id'] === $user['id'], "User ID matches");
            
            // Test chat session creation
            $session = $dal->createChatSession($user['id'], [
                'title' => 'Test Session',
                'metadata' => ['test' => true]
            ]);
            $this->assert($session !== null, "Chat session creation");
            $this->testSessionId = $session['id'];
            
            // Test message creation
            $message = $dal->addMessage($session['id'], 'user', 'Test message', ['test' => true]);
            $this->assert($message !== null, "Message creation");
            $this->testMessageId = $message['id'];
            
            // Test user memory
            $memorySet = $dal->setUserMemory($user['id'], 'test_key', 'test_value', 'test');
            $this->assert($memorySet, "User memory set");
            
            $memoryGet = $dal->getUserMemory($user['id'], 'test_key');
            $this->assert($memoryGet === 'test_value', "User memory get");
            
            $this->passTest("CRUD Operations");
            
        } catch (Exception $e) {
            $this->failTest("CRUD Operations", $e->getMessage());
        }
    }

    private function testMigrationProcess() {
        $this->startTest("Migration Process");
        
        try {
            // Create test data in file storage
            $fileDAL = new FileDataAccess();
            $dbDAL = new PostgreSQLDataAccess();
            
            // Create test user in file storage
            $testEmail = 'migration_test_' . uniqid() . '@test.com';
            $fileUser = $fileDAL->createUser($testEmail, null, ['name' => 'Migration Test']);
            
            // Create test session
            $fileSession = $fileDAL->createChatSession($fileUser['id'], ['title' => 'Migration Test Session']);
            
            // Create test message
            $fileMessage = $fileDAL->addMessage($fileSession['id'], 'user', 'Migration test message');
            
            // Test migration
            $migrationResult = $fileDAL->migrateTo($dbDAL, [
                'batch_size' => 10,
                'types' => ['users', 'chats', 'messages']
            ]);
            
            $this->assert($migrationResult, "Migration execution");
            
            // Verify migrated data
            $migratedUser = $dbDAL->getUserByEmail($testEmail);
            $this->assert($migratedUser !== null, "User migrated");
            $this->assert($migratedUser['name'] === 'Migration Test', "User data preserved");
            
            $migratedSessions = $dbDAL->getUserChatSessions($migratedUser['id']);
            $this->assert(!empty($migratedSessions), "Sessions migrated");
            
            $migratedMessages = $dbDAL->getChatMessages($migratedSessions[0]['id']);
            $this->assert(!empty($migratedMessages), "Messages migrated");
            $this->assert($migratedMessages[0]['content'] === 'Migration test message', "Message content preserved");
            
            $this->passTest("Migration Process");
            
        } catch (Exception $e) {
            $this->failTest("Migration Process", $e->getMessage());
        }
    }

    private function testDataIntegrity() {
        $this->startTest("Data Integrity");
        
        try {
            $dal = DataAccessFactory::create('postgresql');
            
            // Test foreign key constraints
            $user = $dal->getUserByEmail($this->testUserId . '@test.com');
            $sessions = $dal->getUserChatSessions($user['id']);
            
            $this->assert(!empty($sessions), "User has sessions");
            
            $messages = $dal->getChatMessages($sessions[0]['id']);
            $this->assert(!empty($messages), "Session has messages");
            
            // Test data consistency
            $session = $dal->getChatSession($sessions[0]['id']);
            $this->assert($session['user_id'] === $user['id'], "Session belongs to user");
            
            $message = $messages[0];
            $this->assert($message['chat_session_id'] === $session['id'], "Message belongs to session");
            
            $this->passTest("Data Integrity");
            
        } catch (Exception $e) {
            $this->failTest("Data Integrity", $e->getMessage());
        }
    }

    private function testPerformance() {
        $this->startTest("Performance");
        
        try {
            $dal = DataAccessFactory::create('postgresql');
            
            // Test query performance
            $start = microtime(true);
            $users = $dal->getAllUsers();
            $userQueryTime = microtime(true) - $start;
            
            $this->assert($userQueryTime < 1.0, "User query performance acceptable");
            
            if (!empty($users)) {
                $start = microtime(true);
                $sessions = $dal->getUserChatSessions($users[0]['id']);
                $sessionQueryTime = microtime(true) - $start;
                
                $this->assert($sessionQueryTime < 1.0, "Session query performance acceptable");
            }
            
            $this->passTest("Performance");
            
        } catch (Exception $e) {
            $this->failTest("Performance", $e->getMessage());
        }
    }

    private function testErrorHandling() {
        $this->startTest("Error Handling");
        
        try {
            $dal = DataAccessFactory::create('postgresql');
            
            // Test invalid user creation
            try {
                $dal->createUser('invalid-email', null, []);
                $this->assert(false, "Should throw error for invalid email");
            } catch (Exception $e) {
                $this->assert(true, "Correctly handles invalid email");
            }
            
            // Test non-existent user retrieval
            $nonExistentUser = $dal->getUserByEmail('nonexistent@test.com');
            $this->assert($nonExistentUser === null, "Returns null for non-existent user");
            
            // Test invalid session creation
            try {
                $dal->createChatSession('invalid-user-id', []);
                $this->assert(false, "Should throw error for invalid user ID");
            } catch (Exception $e) {
                $this->assert(true, "Correctly handles invalid user ID");
            }
            
            $this->passTest("Error Handling");
            
        } catch (Exception $e) {
            $this->failTest("Error Handling", $e->getMessage());
        }
    }

    private function testCleanup() {
        $this->startTest("Cleanup");
        
        try {
            $dal = DataAccessFactory::create('postgresql');
            
            // Clean up test data
            if ($this->testMessageId) {
                $dal->deleteMessage($this->testMessageId);
            }
            
            if ($this->testSessionId) {
                $dal->deleteChatSession($this->testSessionId);
            }
            
            $user = $dal->getUserByEmail($this->testUserId . '@test.com');
            if ($user) {
                $dal->deleteUserMemory($user['id'], 'test_key');
                $dal->deleteUser($user['id']);
            }
            
            // Test cleanup functions
            if (method_exists($dal, 'cleanupExpiredMemory')) {
                $cleanedCount = $dal->cleanupExpiredMemory();
                $this->assert(is_numeric($cleanedCount), "Cleanup function returns count");
            }
            
            $this->passTest("Cleanup");
            
        } catch (Exception $e) {
            $this->failTest("Cleanup", $e->getMessage());
        }
    }

    private function startTest($testName) {
        echo "Running test: $testName...\n";
    }

    private function passTest($testName) {
        $this->testResults[$testName] = ['status' => 'PASS', 'message' => ''];
        echo "✓ $testName: PASSED\n\n";
    }

    private function failTest($testName, $message) {
        $this->testResults[$testName] = ['status' => 'FAIL', 'message' => $message];
        echo "✗ $testName: FAILED - $message\n\n";
    }

    private function assert($condition, $message) {
        if (!$condition) {
            throw new Exception("Assertion failed: $message");
        }
    }

    private function printResults() {
        echo "=== TEST RESULTS ===\n";
        
        $passed = 0;
        $failed = 0;
        
        foreach ($this->testResults as $testName => $result) {
            $status = $result['status'];
            $message = $result['message'];
            
            echo "$testName: $status";
            if ($message) {
                echo " - $message";
            }
            echo "\n";
            
            if ($status === 'PASS') {
                $passed++;
            } else {
                $failed++;
            }
        }
        
        echo "\nSummary: $passed passed, $failed failed\n";
        
        if ($failed === 0) {
            echo "🎉 All tests passed!\n";
        } else {
            echo "❌ Some tests failed. Please review the results above.\n";
        }
    }

    private function getOverallResult() {
        foreach ($this->testResults as $result) {
            if ($result['status'] === 'FAIL') {
                return false;
            }
        }
        return true;
    }
}

// CLI execution
if (php_sapi_name() === 'cli') {
    $tester = new DatabaseMigrationTest();
    $success = $tester->runAllTests();
    
    exit($success ? 0 : 1);
}
?>
