<?php
/**
 * Test script for WS4 Data Access Layer (DAL)
 * 
 * Tests the DAL interface and file-based implementation
 * Part of Phase 4 Data/Privacy Gate testing
 */

require_once __DIR__ . '/lib/DataAccessInterface.php';

echo "=== WS4 Data Access Layer Test ===\n\n";

// Test 1: Factory creation
echo "Test 1: DAL Factory creation\n";
try {
    $dal = DataAccessFactory::create('file');
    echo "✓ File-based DAL created successfully\n";
    
    $health = $dal->healthCheck();
    echo "✓ Health check: " . $health['status'] . "\n";
    echo "  - Storage type: " . $health['storage_type'] . "\n";
    echo "  - Data directory: " . $health['data_directory'] . "\n";
} catch (Exception $e) {
    echo "✗ DAL creation failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 2: User operations
echo "Test 2: User operations\n";
try {
    // Create user
    $userData = [
        'clerk_id' => 'test_clerk_123',
        'email' => 'test@example.com',
        'name' => 'Test User',
        'profile' => ['role' => 'tester']
    ];
    
    $userId = $dal->createUser($userData);
    echo "✓ User created with ID: {$userId}\n";
    
    // Get user by ID
    $retrievedUser = $dal->getUserById($userId);
    echo "✓ User retrieved by ID: " . $retrievedUser['name'] . "\n";
    
    // Get user by Clerk ID
    $userByClerk = $dal->getUserByClerkId('test_clerk_123');
    echo "✓ User retrieved by Clerk ID: " . $userByClerk['email'] . "\n";
    
    // Update user
    $updated = $dal->updateUser($userId, ['name' => 'Updated Test User']);
    echo "✓ User updated: " . ($updated ? 'success' : 'failed') . "\n";
    
} catch (Exception $e) {
    echo "✗ User operations failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: Chat session operations
echo "Test 3: Chat session operations\n";
try {
    $chatId = 'test_chat_' . uniqid();
    
    // Create chat session
    $sessionId = $dal->createChatSession($chatId, $userId, [
        'profile' => 'general',
        'title' => 'Test Chat Session'
    ]);
    echo "✓ Chat session created with ID: {$sessionId}\n";
    
    // Get chat session
    $session = $dal->getChatSession($chatId);
    echo "✓ Chat session retrieved: " . $session['metadata']['title'] . "\n";
    
    // Update chat session
    $updated = $dal->updateChatSession($chatId, ['metadata' => ['title' => 'Updated Chat Session']]);
    echo "✓ Chat session updated: " . ($updated ? 'success' : 'failed') . "\n";
    
} catch (Exception $e) {
    echo "✗ Chat session operations failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Message operations
echo "Test 4: Message operations\n";
try {
    // Add messages
    $messageId1 = $dal->addMessage($chatId, 'user', 'Hello, this is a test message');
    echo "✓ User message added with ID: {$messageId1}\n";
    
    $messageId2 = $dal->addMessage($chatId, 'assistant', 'Hello! I received your test message.');
    echo "✓ Assistant message added with ID: {$messageId2}\n";
    
    $messageId3 = $dal->addMessage($chatId, 'user', 'Great, the system is working!');
    echo "✓ Second user message added with ID: {$messageId3}\n";
    
    // Get chat history
    $history = $dal->getChatHistory($chatId);
    echo "✓ Chat history retrieved: " . count($history) . " messages\n";
    
    // Get message count
    $count = $dal->getMessageCount($chatId);
    echo "✓ Message count: {$count}\n";
    
    // Display messages
    foreach (array_reverse($history) as $i => $message) {
        echo "  " . ($i + 1) . ". [{$message['role']}] " . substr($message['content'], 0, 50) . "...\n";
    }
    
} catch (Exception $e) {
    echo "✗ Message operations failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 5: User memory operations
echo "Test 5: User memory operations\n";
try {
    // Set user memory
    $dal->setUserMemory($userId, 'profile', 'favorite_color', 'blue');
    $dal->setUserMemory($userId, 'profile', 'age', 25);
    $dal->setUserMemory($userId, 'preferences', 'theme', 'dark');
    $dal->setUserMemory($userId, 'context', 'last_topic', 'testing', 3600); // 1 hour TTL
    echo "✓ User memory values set\n";
    
    // Get specific memory value
    $favoriteColor = $dal->getUserMemory($userId, 'profile', 'favorite_color');
    echo "✓ Favorite color: {$favoriteColor}\n";
    
    // Get all profile memory
    $profileMemory = $dal->getUserMemory($userId, 'profile');
    echo "✓ Profile memory: " . json_encode($profileMemory) . "\n";
    
    // Get memory with TTL
    $lastTopic = $dal->getUserMemory($userId, 'context', 'last_topic');
    echo "✓ Last topic (with TTL): {$lastTopic}\n";
    
} catch (Exception $e) {
    echo "✗ User memory operations failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 6: Search and analytics
echo "Test 6: Search and analytics\n";
try {
    // Search messages
    $searchResults = $dal->searchMessages('test');
    echo "✓ Search results for 'test': " . count($searchResults) . " messages\n";
    
    // User activity stats
    $userStats = $dal->getUserActivityStats($userId);
    echo "✓ User activity stats: " . json_encode($userStats) . "\n";
    
    // System stats
    $systemStats = $dal->getSystemStats();
    echo "✓ System stats: " . json_encode($systemStats) . "\n";
    
} catch (Exception $e) {
    echo "✗ Search and analytics failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 7: Storage statistics
echo "Test 7: Storage statistics\n";
try {
    $storageStats = $dal->getStorageStats();
    echo "✓ Storage statistics:\n";
    echo "  - Storage type: " . $storageStats['storage_type'] . "\n";
    echo "  - Total size: " . number_format($storageStats['total_size']) . " bytes\n";
    echo "  - File counts: " . json_encode($storageStats['file_counts']) . "\n";
    
} catch (Exception $e) {
    echo "✗ Storage statistics failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 8: User chat sessions
echo "Test 8: User chat sessions\n";
try {
    $userSessions = $dal->getUserChatSessions($userId);
    echo "✓ User chat sessions: " . count($userSessions) . " sessions\n";
    
    foreach ($userSessions as $session) {
        echo "  - Chat ID: " . $session['chat_id'] . 
             ", Messages: " . ($session['message_count'] ?? 0) . 
             ", Created: " . $session['created_at'] . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ User chat sessions failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 9: Memory cleanup
echo "Test 9: Memory cleanup\n";
try {
    // Add expired memory entry
    $dal->setUserMemory($userId, 'temp', 'expired_key', 'expired_value', -1); // Already expired
    
    $cleanedCount = $dal->cleanupExpiredMemory();
    echo "✓ Cleaned up {$cleanedCount} expired memory entries\n";
    
    // Verify expired entry is gone
    $expiredValue = $dal->getUserMemory($userId, 'temp', 'expired_key');
    echo "✓ Expired value retrieval: " . ($expiredValue === null ? 'null (correct)' : 'still exists (error)') . "\n";
    
} catch (Exception $e) {
    echo "✗ Memory cleanup failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 10: Transaction operations (no-op for file storage)
echo "Test 10: Transaction operations\n";
try {
    $beginResult = $dal->beginTransaction();
    $commitResult = $dal->commit();
    $rollbackResult = $dal->rollback();
    
    echo "✓ Transaction operations (no-op for file storage):\n";
    echo "  - Begin: " . ($beginResult ? 'success' : 'failed') . "\n";
    echo "  - Commit: " . ($commitResult ? 'success' : 'failed') . "\n";
    echo "  - Rollback: " . ($rollbackResult ? 'success' : 'failed') . "\n";
    
} catch (Exception $e) {
    echo "✗ Transaction operations failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Cleanup test data
echo "Cleanup: Removing test data\n";
try {
    $dal->deleteChatSession($chatId);
    $dal->deleteUser($userId);
    echo "✓ Test data cleaned up\n";
} catch (Exception $e) {
    echo "✗ Cleanup failed: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== All DAL Tests Completed ===\n";
echo "The Data Access Layer provides a consistent interface for data operations.\n";
echo "File-based implementation wraps current JSON storage with proper abstraction.\n";
echo "Ready for PostgreSQL implementation and gradual migration.\n";
