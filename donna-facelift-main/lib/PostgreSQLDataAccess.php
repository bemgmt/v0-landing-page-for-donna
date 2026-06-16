<?php
/**
 * PostgreSQL Data Access Implementation
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Phase 4 Task 4.4: Minimal DB pilot implementation
 */

require_once __DIR__ . '/DataAccessInterface.php';
require_once __DIR__ . '/logging_helpers.php';

class PostgreSQLDataAccess implements DataAccessInterface {
    
    private $pdo;
    private $inTransaction = false;
    
    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }
    
    // ========================================
    // User Operations (Pilot Entity)
    // ========================================
    
    public function createUser(array $userData): string {
        $sql = "INSERT INTO users (clerk_id, email, name, profile, preferences, vertical, status)
                VALUES (:clerk_id, :email, :name, :profile, :preferences, :vertical, :status)
                RETURNING id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'clerk_id' => $userData['clerk_id'] ?? null,
            'email' => $userData['email'] ?? null,
            'name' => $userData['name'] ?? null,
            'profile' => json_encode($userData['profile'] ?? []),
            'preferences' => json_encode($userData['preferences'] ?? []),
            'vertical' => $userData['vertical'] ?? null,
            'status' => $userData['status'] ?? 'active'
        ]);

        $result = $stmt->fetch();
        $userId = $result['id'];

        log_info('User created in database', ['user_id' => $userId, 'clerk_id' => $userData['clerk_id'] ?? null, 'vertical' => $userData['vertical'] ?? null]);
        return $userId;
    }
    
    public function getUserById(string $userId): ?array {
        $sql = "SELECT * FROM users WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $userId]);
        
        $user = $stmt->fetch();
        if ($user) {
            $user['profile'] = json_decode($user['profile'], true);
            $user['preferences'] = json_decode($user['preferences'], true);
        }
        
        return $user ?: null;
    }
    
    public function getUserByClerkId(string $clerkId): ?array {
        $sql = "SELECT * FROM users WHERE clerk_id = :clerk_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['clerk_id' => $clerkId]);
        
        $user = $stmt->fetch();
        if ($user) {
            $user['profile'] = json_decode($user['profile'], true);
            $user['preferences'] = json_decode($user['preferences'], true);
        }
        
        return $user ?: null;
    }
    
    public function updateUser(string $userId, array $updates): bool {
        $allowedFields = ['email', 'name', 'profile', 'preferences', 'vertical', 'last_active_at', 'status'];
        $setClause = [];
        $params = ['id' => $userId];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setClause[] = "{$field} = :{$field}";
                if (in_array($field, ['profile', 'preferences']) && is_array($value)) {
                    $params[$field] = json_encode($value);
                } else {
                    $params[$field] = $value;
                }
            }
        }

        if (empty($setClause)) {
            return false;
        }

        $sql = "UPDATE users SET " . implode(', ', $setClause) . " WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute($params);
    }
    
    public function deleteUser(string $userId): bool {
        $sql = "DELETE FROM users WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute(['id' => $userId]);
        
        if ($result) {
            log_info('User deleted from database', ['user_id' => $userId]);
        }
        
        return $result;
    }
    
    // ========================================
    // Chat Session Operations
    // ========================================
    
    public function createChatSession(string $chatId, ?string $userId, array $metadata = []): string {
        $sql = "INSERT INTO chat_sessions (chat_id, user_id, title, profile, metadata) 
                VALUES (:chat_id, :user_id, :title, :profile, :metadata) 
                RETURNING id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'chat_id' => $chatId,
            'user_id' => $userId,
            'title' => $metadata['title'] ?? null,
            'profile' => $metadata['profile'] ?? 'general',
            'metadata' => json_encode($metadata)
        ]);
        
        $result = $stmt->fetch();
        $sessionId = $result['id'];
        
        log_info('Chat session created in database', ['chat_id' => $chatId, 'session_id' => $sessionId]);
        return $sessionId;
    }
    
    public function getChatSession(string $chatId): ?array {
        $sql = "SELECT * FROM chat_sessions WHERE chat_id = :chat_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['chat_id' => $chatId]);
        
        $session = $stmt->fetch();
        if ($session) {
            $session['metadata'] = json_decode($session['metadata'], true);
        }
        
        return $session ?: null;
    }
    
    public function updateChatSession(string $chatId, array $updates): bool {
        $allowedFields = ['title', 'profile', 'metadata', 'last_message_at', 'message_count', 'status'];
        $setClause = [];
        $params = ['chat_id' => $chatId];
        
        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setClause[] = "{$field} = :{$field}";
                if ($field === 'metadata' && is_array($value)) {
                    $params[$field] = json_encode($value);
                } else {
                    $params[$field] = $value;
                }
            }
        }
        
        if (empty($setClause)) {
            return false;
        }
        
        $sql = "UPDATE chat_sessions SET " . implode(', ', $setClause) . " WHERE chat_id = :chat_id";
        $stmt = $this->pdo->prepare($sql);
        
        return $stmt->execute($params);
    }
    
    public function deleteChatSession(string $chatId): bool {
        $sql = "DELETE FROM chat_sessions WHERE chat_id = :chat_id";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute(['chat_id' => $chatId]);
        
        if ($result) {
            log_info('Chat session deleted from database', ['chat_id' => $chatId]);
        }
        
        return $result;
    }
    
    public function getUserChatSessions(string $userId, int $limit = 50, int $offset = 0): array {
        $sql = "SELECT * FROM chat_sessions 
                WHERE user_id = :user_id 
                ORDER BY last_message_at DESC NULLS LAST, created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue('user_id', $userId);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $sessions = $stmt->fetchAll();
        foreach ($sessions as &$session) {
            $session['metadata'] = json_decode($session['metadata'], true);
        }
        
        return $sessions;
    }
    
    // ========================================
    // Message Operations
    // ========================================
    
    public function addMessage(string $chatId, string $role, string $content, array $metadata = []): string {
        // First get the chat session ID
        $session = $this->getChatSession($chatId);
        if (!$session) {
            throw new Exception("Chat session not found: {$chatId}");
        }
        
        // Get next sequence number
        $sql = "SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_seq 
                FROM messages WHERE chat_session_id = :session_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['session_id' => $session['id']]);
        $nextSeq = $stmt->fetch()['next_seq'];
        
        // Insert message
        $sql = "INSERT INTO messages (chat_session_id, role, content, metadata, sequence_number) 
                VALUES (:session_id, :role, :content, :metadata, :sequence_number) 
                RETURNING id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'session_id' => $session['id'],
            'role' => $role,
            'content' => $content,
            'metadata' => json_encode($metadata),
            'sequence_number' => $nextSeq
        ]);
        
        $result = $stmt->fetch();
        $messageId = $result['id'];
        
        // Update session message count and last message time
        $this->updateChatSession($chatId, [
            'message_count' => $nextSeq,
            'last_message_at' => date('c')
        ]);
        
        return $messageId;
    }
    
    public function getChatHistory(string $chatId, int $limit = 20, int $offset = 0): array {
        $session = $this->getChatSession($chatId);
        if (!$session) {
            return [];
        }
        
        $sql = "SELECT * FROM messages 
                WHERE chat_session_id = :session_id 
                ORDER BY sequence_number DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue('session_id', $session['id']);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $messages = $stmt->fetchAll();
        foreach ($messages as &$message) {
            $message['metadata'] = json_decode($message['metadata'], true);
        }
        
        return $messages;
    }
    
    public function getMessageCount(string $chatId): int {
        $session = $this->getChatSession($chatId);
        if (!$session) {
            return 0;
        }
        
        $sql = "SELECT COUNT(*) as count FROM messages WHERE chat_session_id = :session_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['session_id' => $session['id']]);
        
        return (int) $stmt->fetch()['count'];
    }
    
    public function updateMessage(string $messageId, array $updates): bool {
        $allowedFields = ['content', 'metadata', 'token_count', 'abuse_flagged'];
        $setClause = [];
        $params = ['id' => $messageId];
        
        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setClause[] = "{$field} = :{$field}";
                if ($field === 'metadata' && is_array($value)) {
                    $params[$field] = json_encode($value);
                } else {
                    $params[$field] = $value;
                }
            }
        }
        
        if (empty($setClause)) {
            return false;
        }
        
        $sql = "UPDATE messages SET " . implode(', ', $setClause) . " WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        
        return $stmt->execute($params);
    }
    
    public function deleteMessage(string $messageId): bool {
        $sql = "DELETE FROM messages WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute(['id' => $messageId]);
    }

    // ========================================
    // User Memory Operations
    // ========================================

    public function setUserMemory(string $userId, string $type, string $key, $value, ?int $ttl = null): bool {
        $expiresAt = $ttl ? date('c', time() + $ttl) : null;

        $sql = "INSERT INTO user_memory (user_id, memory_type, key, value, expires_at)
                VALUES (:user_id, :memory_type, :key, :value, :expires_at)
                ON CONFLICT (user_id, memory_type, key)
                DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at, updated_at = NOW()";

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            'user_id' => $userId,
            'memory_type' => $type,
            'key' => $key,
            'value' => json_encode($value),
            'expires_at' => $expiresAt
        ]);
    }

    public function getUserMemory(string $userId, string $type, ?string $key = null) {
        if ($key) {
            $sql = "SELECT value FROM user_memory
                    WHERE user_id = :user_id AND memory_type = :memory_type AND key = :key
                    AND (expires_at IS NULL OR expires_at > NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'memory_type' => $type,
                'key' => $key
            ]);

            $result = $stmt->fetch();
            return $result ? json_decode($result['value'], true) : null;
        } else {
            $sql = "SELECT key, value FROM user_memory
                    WHERE user_id = :user_id AND memory_type = :memory_type
                    AND (expires_at IS NULL OR expires_at > NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'memory_type' => $type
            ]);

            $results = [];
            while ($row = $stmt->fetch()) {
                $results[$row['key']] = json_decode($row['value'], true);
            }
            return $results;
        }
    }

    public function deleteUserMemory(string $userId, string $type, ?string $key = null): bool {
        if ($key) {
            $sql = "DELETE FROM user_memory
                    WHERE user_id = :user_id AND memory_type = :memory_type AND key = :key";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                'user_id' => $userId,
                'memory_type' => $type,
                'key' => $key
            ]);
        } else {
            $sql = "DELETE FROM user_memory
                    WHERE user_id = :user_id AND memory_type = :memory_type";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                'user_id' => $userId,
                'memory_type' => $type
            ]);
        }
    }

    public function cleanupExpiredMemory(): int {
        $sql = "SELECT cleanup_expired_memory()";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        return (int) $stmt->fetch()['cleanup_expired_memory'];
    }

    // ========================================
    // Search and Analytics
    // ========================================

    public function searchMessages(string $query, array $filters = [], int $limit = 50): array {
        $whereClause = ["content ILIKE :query"];
        $params = ['query' => "%{$query}%"];

        if (isset($filters['user_id'])) {
            $whereClause[] = "cs.user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }

        if (isset($filters['chat_id'])) {
            $whereClause[] = "cs.chat_id = :chat_id";
            $params['chat_id'] = $filters['chat_id'];
        }

        $sql = "SELECT m.*, cs.chat_id, cs.title as chat_title
                FROM messages m
                JOIN chat_sessions cs ON m.chat_session_id = cs.id
                WHERE " . implode(' AND ', $whereClause) . "
                ORDER BY m.created_at DESC
                LIMIT :limit";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();

        $results = $stmt->fetchAll();
        foreach ($results as &$result) {
            $result['metadata'] = json_decode($result['metadata'], true);
        }

        return $results;
    }

    public function getUserActivityStats(string $userId, string $period = 'week'): array {
        $interval = match($period) {
            'day' => '1 day',
            'week' => '7 days',
            'month' => '30 days',
            default => '7 days'
        };

        $sql = "SELECT
                    COUNT(DISTINCT cs.id) as total_sessions,
                    COALESCE(SUM(cs.message_count), 0) as total_messages,
                    MAX(cs.last_message_at) as last_activity
                FROM chat_sessions cs
                WHERE cs.user_id = :user_id
                AND cs.created_at > NOW() - INTERVAL '{$interval}'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['user_id' => $userId]);

        $stats = $stmt->fetch();
        $stats['period'] = $period;

        return $stats;
    }

    public function getSystemStats(string $period = 'day'): array {
        $interval = match($period) {
            'day' => '1 day',
            'week' => '7 days',
            'month' => '30 days',
            default => '1 day'
        };

        $sql = "SELECT
                    COUNT(DISTINCT u.id) as active_users,
                    COUNT(DISTINCT cs.id) as total_sessions,
                    COALESCE(SUM(cs.message_count), 0) as total_messages
                FROM users u
                LEFT JOIN chat_sessions cs ON u.id = cs.user_id
                WHERE u.last_active_at > NOW() - INTERVAL '{$interval}'
                OR cs.created_at > NOW() - INTERVAL '{$interval}'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        $stats = $stmt->fetch();
        $stats['period'] = $period;

        return $stats;
    }

    // ========================================
    // Transaction Management
    // ========================================

    public function beginTransaction(): bool {
        if (!$this->inTransaction) {
            $this->inTransaction = $this->pdo->beginTransaction();
        }
        return $this->inTransaction;
    }

    public function commit(): bool {
        if ($this->inTransaction) {
            $result = $this->pdo->commit();
            $this->inTransaction = false;
            return $result;
        }
        return true;
    }

    public function rollback(): bool {
        if ($this->inTransaction) {
            $result = $this->pdo->rollback();
            $this->inTransaction = false;
            return $result;
        }
        return true;
    }

    // ========================================
    // System Operations
    // ========================================

    public function healthCheck(): array {
        try {
            $sql = "SELECT 1 as test";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            return [
                'status' => 'healthy',
                'storage_type' => 'postgresql',
                'database' => $this->pdo->getAttribute(PDO::ATTR_CONNECTION_STATUS),
                'timestamp' => date('c')
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'storage_type' => 'postgresql',
                'error' => $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }

    public function getStorageStats(): array {
        $sql = "SELECT
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    n_live_tup as live_tuples,
                    n_dead_tup as dead_tuples
                FROM pg_stat_user_tables
                WHERE schemaname = 'public'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        $tableStats = $stmt->fetchAll();

        return [
            'storage_type' => 'postgresql',
            'table_statistics' => $tableStats,
            'timestamp' => date('c')
        ];
    }

    public function backup(string $destination, array $options = []): bool {
        // PostgreSQL backup would typically use pg_dump
        // This is a placeholder implementation
        log_warning('PostgreSQL backup not implemented', ['destination' => $destination]);
        return false;
    }

    public function restore(string $source, array $options = []): bool {
        // PostgreSQL restore would typically use pg_restore
        // This is a placeholder implementation
        log_warning('PostgreSQL restore not implemented', ['source' => $source]);
        return false;
    }

    public function migrateTo(DataAccessInterface $target, array $options = []): bool {
        // Migration from PostgreSQL to another storage type
        // This is a placeholder implementation
        log_warning('PostgreSQL migration not implemented');
        return false;
    }
}
