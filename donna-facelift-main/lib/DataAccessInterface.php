<?php
/**
 * Data Access Layer Interface
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Defines the contract for data storage implementations
 * Supports both file-based and database storage
 */

interface DataAccessInterface {
    
    // ========================================
    // User Operations
    // ========================================
    
    /**
     * Create a new user
     * @param array $userData User data (clerk_id, email, name, profile, etc.)
     * @return string User ID
     */
    public function createUser(array $userData): string;
    
    /**
     * Get user by ID
     * @param string $userId User ID
     * @return array|null User data or null if not found
     */
    public function getUserById(string $userId): ?array;
    
    /**
     * Get user by Clerk ID
     * @param string $clerkId Clerk authentication ID
     * @return array|null User data or null if not found
     */
    public function getUserByClerkId(string $clerkId): ?array;
    
    /**
     * Update user data
     * @param string $userId User ID
     * @param array $updates Fields to update
     * @return bool Success status
     */
    public function updateUser(string $userId, array $updates): bool;
    
    /**
     * Delete a user and all associated data
     * @param string $userId User ID
     * @return bool Success status
     */
    public function deleteUser(string $userId): bool;
    
    // ========================================
    // Chat Session Operations
    // ========================================
    
    /**
     * Create a new chat session
     * @param string $chatId Unique chat identifier
     * @param string|null $userId Associated user ID (null for anonymous)
     * @param array $metadata Session metadata (profile, title, etc.)
     * @return string Session ID
     */
    public function createChatSession(string $chatId, ?string $userId, array $metadata = []): string;
    
    /**
     * Get chat session by chat ID
     * @param string $chatId Chat identifier
     * @return array|null Session data or null if not found
     */
    public function getChatSession(string $chatId): ?array;
    
    /**
     * Update chat session
     * @param string $chatId Chat identifier
     * @param array $updates Fields to update
     * @return bool Success status
     */
    public function updateChatSession(string $chatId, array $updates): bool;
    
    /**
     * Delete a chat session and all messages
     * @param string $chatId Chat identifier
     * @return bool Success status
     */
    public function deleteChatSession(string $chatId): bool;
    
    /**
     * Get chat sessions for a user
     * @param string $userId User ID
     * @param int $limit Maximum number of sessions
     * @param int $offset Offset for pagination
     * @return array List of chat sessions
     */
    public function getUserChatSessions(string $userId, int $limit = 50, int $offset = 0): array;
    
    // ========================================
    // Message Operations
    // ========================================
    
    /**
     * Add a message to a chat session
     * @param string $chatId Chat identifier
     * @param string $role Message role (user, assistant, system)
     * @param string $content Message content
     * @param array $metadata Message metadata
     * @return string Message ID
     */
    public function addMessage(string $chatId, string $role, string $content, array $metadata = []): string;
    
    /**
     * Get chat history (messages)
     * @param string $chatId Chat identifier
     * @param int $limit Maximum number of messages
     * @param int $offset Offset for pagination
     * @return array List of messages
     */
    public function getChatHistory(string $chatId, int $limit = 20, int $offset = 0): array;
    
    /**
     * Get message count for a chat
     * @param string $chatId Chat identifier
     * @return int Number of messages
     */
    public function getMessageCount(string $chatId): int;
    
    /**
     * Update a message
     * @param string $messageId Message ID
     * @param array $updates Fields to update
     * @return bool Success status
     */
    public function updateMessage(string $messageId, array $updates): bool;
    
    /**
     * Delete a message
     * @param string $messageId Message ID
     * @return bool Success status
     */
    public function deleteMessage(string $messageId): bool;
    
    // ========================================
    // User Memory Operations
    // ========================================
    
    /**
     * Set user memory value
     * @param string $userId User ID
     * @param string $type Memory type (profile, preferences, context)
     * @param string $key Memory key
     * @param mixed $value Memory value
     * @param int|null $ttl Time to live in seconds (null for permanent)
     * @return bool Success status
     */
    public function setUserMemory(string $userId, string $type, string $key, $value, ?int $ttl = null): bool;
    
    /**
     * Get user memory value(s)
     * @param string $userId User ID
     * @param string $type Memory type
     * @param string|null $key Specific key (null for all keys of type)
     * @return mixed Memory value or array of values
     */
    public function getUserMemory(string $userId, string $type, ?string $key = null);
    
    /**
     * Delete user memory
     * @param string $userId User ID
     * @param string $type Memory type
     * @param string|null $key Specific key (null to delete all of type)
     * @return bool Success status
     */
    public function deleteUserMemory(string $userId, string $type, ?string $key = null): bool;
    
    /**
     * Clean up expired memory entries
     * @return int Number of entries cleaned up
     */
    public function cleanupExpiredMemory(): int;
    
    // ========================================
    // Search and Analytics
    // ========================================
    
    /**
     * Search messages by content
     * @param string $query Search query
     * @param array $filters Additional filters (user_id, chat_id, date_range)
     * @param int $limit Maximum results
     * @return array Search results
     */
    public function searchMessages(string $query, array $filters = [], int $limit = 50): array;
    
    /**
     * Get user activity statistics
     * @param string $userId User ID
     * @param string $period Period (day, week, month)
     * @return array Activity statistics
     */
    public function getUserActivityStats(string $userId, string $period = 'week'): array;
    
    /**
     * Get system usage statistics
     * @param string $period Period (day, week, month)
     * @return array Usage statistics
     */
    public function getSystemStats(string $period = 'day'): array;
    
    // ========================================
    // Transaction Management
    // ========================================
    
    /**
     * Begin a database transaction
     * @return bool Success status
     */
    public function beginTransaction(): bool;
    
    /**
     * Commit the current transaction
     * @return bool Success status
     */
    public function commit(): bool;
    
    /**
     * Rollback the current transaction
     * @return bool Success status
     */
    public function rollback(): bool;
    
    // ========================================
    // System Operations
    // ========================================
    
    /**
     * Perform health check on the data storage
     * @return array Health status information
     */
    public function healthCheck(): array;
    
    /**
     * Get storage statistics
     * @return array Storage usage and performance metrics
     */
    public function getStorageStats(): array;
    
    /**
     * Backup data to specified location
     * @param string $destination Backup destination
     * @param array $options Backup options
     * @return bool Success status
     */
    public function backup(string $destination, array $options = []): bool;
    
    /**
     * Restore data from backup
     * @param string $source Backup source
     * @param array $options Restore options
     * @return bool Success status
     */
    public function restore(string $source, array $options = []): bool;
    
    /**
     * Migrate data to another storage implementation
     * @param DataAccessInterface $target Target storage implementation
     * @param array $options Migration options
     * @return bool Success status
     */
    public function migrateTo(DataAccessInterface $target, array $options = []): bool;
}
