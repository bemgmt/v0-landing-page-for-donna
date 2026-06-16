<?php
/**
 * File-Based Data Access Implementation
 * 
 * Part of WS4 - Data Management, Logging & Error Handling
 * Wraps current file-based JSON storage with DAL interface
 */

require_once __DIR__ . '/DataAccessInterface.php';
require_once __DIR__ . '/logging_helpers.php';

class FileDataAccess implements DataAccessInterface {
    
    private $dataDir;
    private $chatDir;
    private $memoryDir;
    private $usersDir;
    
    public function __construct(string $dataDir) {
        $this->dataDir = rtrim($dataDir, '/');
        $this->chatDir = $this->dataDir . '/chat_sessions';
        $this->memoryDir = $this->dataDir . '/memory';
        $this->usersDir = $this->dataDir . '/users';
        
        // Ensure directories exist with secure permissions
        foreach ([$this->dataDir, $this->chatDir, $this->memoryDir, $this->usersDir] as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }
    
    // ========================================
    // User Operations
    // ========================================
    
    public function createUser(array $userData): string {
        $userId = $userData['id'] ?? $this->generateId();
        $userData['id'] = $userId;
        $userData['created_at'] = date('c');
        $userData['updated_at'] = date('c');
        
        $userFile = $this->usersDir . '/' . $userId . '.json';
        $this->writeJsonFile($userFile, $userData);
        
        log_info('User created', ['user_id' => $userId, 'clerk_id' => $userData['clerk_id'] ?? null]);
        return $userId;
    }
    
    public function getUserById(string $userId): ?array {
        $userFile = $this->usersDir . '/' . $userId . '.json';
        return $this->readJsonFile($userFile);
    }
    
    public function getUserByClerkId(string $clerkId): ?array {
        // Scan all user files to find by clerk_id
        $files = glob($this->usersDir . '/*.json');
        foreach ($files as $file) {
            $userData = $this->readJsonFile($file);
            if ($userData && ($userData['clerk_id'] ?? null) === $clerkId) {
                return $userData;
            }
        }
        return null;
    }
    
    public function updateUser(string $userId, array $updates): bool {
        $userData = $this->getUserById($userId);
        if (!$userData) {
            return false;
        }
        
        $userData = array_merge($userData, $updates);
        $userData['updated_at'] = date('c');
        
        $userFile = $this->usersDir . '/' . $userId . '.json';
        return $this->writeJsonFile($userFile, $userData);
    }
    
    public function deleteUser(string $userId): bool {
        $userFile = $this->usersDir . '/' . $userId . '.json';
        if (file_exists($userFile)) {
            unlink($userFile);
            log_info('User deleted', ['user_id' => $userId]);
            return true;
        }
        return false;
    }
    
    // ========================================
    // Chat Session Operations
    // ========================================
    
    public function createChatSession(string $chatId, ?string $userId, array $metadata = []): string {
        $sessionData = [
            'id' => $this->generateId(),
            'chat_id' => $chatId,
            'user_id' => $userId,
            'created_at' => date('c'),
            'updated_at' => date('c'),
            'last_message_at' => null,
            'message_count' => 0,
            'metadata' => $metadata
        ];
        
        $sessionFile = $this->chatDir . '/' . $chatId . '_session.json';
        $this->writeJsonFile($sessionFile, $sessionData);
        
        log_info('Chat session created', ['chat_id' => $chatId, 'user_id' => $userId]);
        return $sessionData['id'];
    }
    
    public function getChatSession(string $chatId): ?array {
        $sessionFile = $this->chatDir . '/' . $chatId . '_session.json';
        return $this->readJsonFile($sessionFile);
    }
    
    public function updateChatSession(string $chatId, array $updates): bool {
        $sessionData = $this->getChatSession($chatId);
        if (!$sessionData) {
            return false;
        }
        
        $sessionData = array_merge($sessionData, $updates);
        $sessionData['updated_at'] = date('c');
        
        $sessionFile = $this->chatDir . '/' . $chatId . '_session.json';
        return $this->writeJsonFile($sessionFile, $sessionData);
    }
    
    public function deleteChatSession(string $chatId): bool {
        $sessionFile = $this->chatDir . '/' . $chatId . '_session.json';
        $historyFile = $this->chatDir . '/' . $chatId . '.json';
        
        $deleted = false;
        if (file_exists($sessionFile)) {
            unlink($sessionFile);
            $deleted = true;
        }
        if (file_exists($historyFile)) {
            unlink($historyFile);
            $deleted = true;
        }
        
        if ($deleted) {
            log_info('Chat session deleted', ['chat_id' => $chatId]);
        }
        return $deleted;
    }
    
    public function getUserChatSessions(string $userId, int $limit = 50, int $offset = 0): array {
        $sessions = [];
        $files = glob($this->chatDir . '/*_session.json');
        
        foreach ($files as $file) {
            $sessionData = $this->readJsonFile($file);
            if ($sessionData && ($sessionData['user_id'] ?? null) === $userId) {
                $sessions[] = $sessionData;
            }
        }
        
        // Sort by last message time (most recent first)
        usort($sessions, function($a, $b) {
            $timeA = $a['last_message_at'] ?? $a['created_at'];
            $timeB = $b['last_message_at'] ?? $b['created_at'];
            return strtotime($timeB) - strtotime($timeA);
        });
        
        return array_slice($sessions, $offset, $limit);
    }
    
    // ========================================
    // Message Operations
    // ========================================
    
    public function addMessage(string $chatId, string $role, string $content, array $metadata = []): string {
        $messageId = $this->generateId();
        $historyFile = $this->chatDir . '/' . $chatId . '.json';
        
        // Load existing history
        $history = $this->readJsonFile($historyFile) ?: [];
        
        // Add new message
        $message = [
            'id' => $messageId,
            'role' => $role,
            'content' => $content,
            'metadata' => $metadata,
            'created_at' => date('c'),
            'sequence_number' => count($history) + 1
        ];
        
        $history[] = $message;
        
        // Save updated history
        $this->writeJsonFile($historyFile, $history);
        
        // Update session metadata
        $this->updateChatSession($chatId, [
            'last_message_at' => date('c'),
            'message_count' => count($history)
        ]);
        
        return $messageId;
    }
    
    public function getChatHistory(string $chatId, int $limit = 20, int $offset = 0): array {
        $historyFile = $this->chatDir . '/' . $chatId . '.json';
        $history = $this->readJsonFile($historyFile) ?: [];
        
        // Return most recent messages first
        $history = array_reverse($history);
        return array_slice($history, $offset, $limit);
    }
    
    public function getMessageCount(string $chatId): int {
        $historyFile = $this->chatDir . '/' . $chatId . '.json';
        $history = $this->readJsonFile($historyFile) ?: [];
        return count($history);
    }
    
    public function updateMessage(string $messageId, array $updates): bool {
        // This would require scanning all chat files to find the message
        // For now, return false as this is complex with file storage
        return false;
    }
    
    public function deleteMessage(string $messageId): bool {
        // This would require scanning all chat files to find and remove the message
        // For now, return false as this is complex with file storage
        return false;
    }
    
    // ========================================
    // User Memory Operations
    // ========================================
    
    public function setUserMemory(string $userId, string $type, string $key, $value, ?int $ttl = null): bool {
        $memoryFile = $this->memoryDir . '/' . $userId . '.json';
        $memory = $this->readJsonFile($memoryFile) ?: [];
        
        if (!isset($memory[$type])) {
            $memory[$type] = [];
        }
        
        $memory[$type][$key] = [
            'value' => $value,
            'created_at' => date('c'),
            'expires_at' => $ttl ? date('c', time() + $ttl) : null
        ];
        
        return $this->writeJsonFile($memoryFile, $memory);
    }
    
    public function getUserMemory(string $userId, string $type, ?string $key = null) {
        $memoryFile = $this->memoryDir . '/' . $userId . '.json';
        $memory = $this->readJsonFile($memoryFile) ?: [];
        
        if (!isset($memory[$type])) {
            return $key ? null : [];
        }
        
        $typeMemory = $memory[$type];
        
        // Clean up expired entries
        foreach ($typeMemory as $k => $entry) {
            if ($entry['expires_at'] && strtotime($entry['expires_at']) < time()) {
                unset($typeMemory[$k]);
            }
        }
        
        if ($key) {
            return isset($typeMemory[$key]) ? $typeMemory[$key]['value'] : null;
        }
        
        // Return all values for the type
        $result = [];
        foreach ($typeMemory as $k => $entry) {
            $result[$k] = $entry['value'];
        }
        return $result;
    }
    
    public function deleteUserMemory(string $userId, string $type, ?string $key = null): bool {
        $memoryFile = $this->memoryDir . '/' . $userId . '.json';
        $memory = $this->readJsonFile($memoryFile) ?: [];
        
        if ($key) {
            unset($memory[$type][$key]);
        } else {
            unset($memory[$type]);
        }
        
        return $this->writeJsonFile($memoryFile, $memory);
    }
    
    public function cleanupExpiredMemory(): int {
        $cleaned = 0;
        $files = glob($this->memoryDir . '/*.json');
        
        foreach ($files as $file) {
            $memory = $this->readJsonFile($file);
            if (!$memory) continue;
            
            $modified = false;
            foreach ($memory as $type => $typeMemory) {
                foreach ($typeMemory as $key => $entry) {
                    if ($entry['expires_at'] && strtotime($entry['expires_at']) < time()) {
                        unset($memory[$type][$key]);
                        $cleaned++;
                        $modified = true;
                    }
                }
            }
            
            if ($modified) {
                $this->writeJsonFile($file, $memory);
            }
        }
        
        return $cleaned;
    }

    // ========================================
    // Search and Analytics (Limited Implementation)
    // ========================================

    public function searchMessages(string $query, array $filters = [], int $limit = 50): array {
        // Basic text search across all chat files
        $results = [];
        $files = glob($this->chatDir . '/*.json');

        foreach ($files as $file) {
            if (strpos(basename($file), '_session.json') !== false) continue;

            $history = $this->readJsonFile($file);
            if (!$history) continue;

            foreach ($history as $message) {
                if (stripos($message['content'], $query) !== false) {
                    $results[] = $message;
                    if (count($results) >= $limit) break 2;
                }
            }
        }

        return $results;
    }

    public function getUserActivityStats(string $userId, string $period = 'week'): array {
        // Basic activity stats
        $sessions = $this->getUserChatSessions($userId, 1000);
        $messageCount = 0;

        foreach ($sessions as $session) {
            $messageCount += $session['message_count'] ?? 0;
        }

        return [
            'total_sessions' => count($sessions),
            'total_messages' => $messageCount,
            'period' => $period
        ];
    }

    public function getSystemStats(string $period = 'day'): array {
        $totalSessions = count(glob($this->chatDir . '/*_session.json'));
        $totalUsers = count(glob($this->usersDir . '/*.json'));

        return [
            'total_users' => $totalUsers,
            'total_sessions' => $totalSessions,
            'period' => $period
        ];
    }

    // ========================================
    // Transaction Management (No-op for files)
    // ========================================

    public function beginTransaction(): bool {
        // File storage doesn't support transactions
        return true;
    }

    public function commit(): bool {
        // File storage doesn't support transactions
        return true;
    }

    public function rollback(): bool {
        // File storage doesn't support transactions
        return true;
    }

    // ========================================
    // System Operations
    // ========================================

    public function healthCheck(): array {
        $status = 'healthy';
        $issues = [];

        // Check if directories are writable
        foreach ([$this->dataDir, $this->chatDir, $this->memoryDir, $this->usersDir] as $dir) {
            if (!is_writable($dir)) {
                $status = 'unhealthy';
                $issues[] = "Directory not writable: {$dir}";
            }
        }

        return [
            'status' => $status,
            'storage_type' => 'file',
            'data_directory' => $this->dataDir,
            'issues' => $issues,
            'timestamp' => date('c')
        ];
    }

    public function getStorageStats(): array {
        $stats = [
            'storage_type' => 'file',
            'data_directory' => $this->dataDir,
            'total_size' => 0,
            'file_counts' => []
        ];

        foreach (['chat_sessions', 'memory', 'users'] as $subdir) {
            $path = $this->dataDir . '/' . $subdir;
            $files = glob($path . '/*.json');
            $size = 0;

            foreach ($files as $file) {
                $size += filesize($file);
            }

            $stats['file_counts'][$subdir] = count($files);
            $stats['total_size'] += $size;
        }

        return $stats;
    }

    public function backup(string $destination, array $options = []): bool {
        // Simple backup by copying the entire data directory
        try {
            $this->copyDirectory($this->dataDir, $destination);
            log_info('Data backup completed', ['destination' => $destination]);
            return true;
        } catch (Exception $e) {
            log_error('Data backup failed', ['destination' => $destination, 'error' => $e->getMessage()]);
            return false;
        }
    }

    public function restore(string $source, array $options = []): bool {
        // Simple restore by copying from backup directory
        try {
            $this->copyDirectory($source, $this->dataDir);
            log_info('Data restore completed', ['source' => $source]);
            return true;
        } catch (Exception $e) {
            log_error('Data restore failed', ['source' => $source, 'error' => $e->getMessage()]);
            return false;
        }
    }

    public function migrateTo(DataAccessInterface $target, array $options = []): bool {
        // Migrate all data to target DAL
        try {
            $batchSize = $options['batch_size'] ?? 100;
            $migrated = 0;

            // Migrate users
            $userFiles = glob($this->usersDir . '/*.json');
            foreach ($userFiles as $file) {
                $userData = $this->readJsonFile($file);
                if ($userData) {
                    $target->createUser($userData);
                    $migrated++;
                }
            }

            // Migrate chat sessions and messages
            $sessionFiles = glob($this->chatDir . '/*_session.json');
            foreach ($sessionFiles as $file) {
                $sessionData = $this->readJsonFile($file);
                if ($sessionData) {
                    $chatId = $sessionData['chat_id'];
                    $target->createChatSession($chatId, $sessionData['user_id'], $sessionData['metadata']);

                    // Migrate messages
                    $history = $this->getChatHistory($chatId, 10000);
                    foreach (array_reverse($history) as $message) {
                        $target->addMessage($chatId, $message['role'], $message['content'], $message['metadata']);
                    }
                    $migrated++;
                }
            }

            // Migrate user memory
            $memoryFiles = glob($this->memoryDir . '/*.json');
            foreach ($memoryFiles as $file) {
                $userId = basename($file, '.json');
                $memory = $this->readJsonFile($file);
                if ($memory) {
                    foreach ($memory as $type => $typeMemory) {
                        foreach ($typeMemory as $key => $entry) {
                            $ttl = $entry['expires_at'] ? strtotime($entry['expires_at']) - time() : null;
                            $target->setUserMemory($userId, $type, $key, $entry['value'], $ttl);
                        }
                    }
                    $migrated++;
                }
            }

            log_info('Data migration completed', ['migrated_entities' => $migrated]);
            return true;

        } catch (Exception $e) {
            log_error('Data migration failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    // ========================================
    // Helper Methods
    // ========================================

    private function generateId(): string {
        return uniqid('', true) . '_' . bin2hex(random_bytes(8));
    }

    private function readJsonFile(string $filePath): ?array {
        if (!file_exists($filePath)) {
            return null;
        }

        $content = file_get_contents($filePath);
        if ($content === false) {
            return null;
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    private function writeJsonFile(string $filePath, array $data): bool {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            return false;
        }

        $result = file_put_contents($filePath, $json, LOCK_EX);
        if ($result !== false) {
            chmod($filePath, 0644);
            return true;
        }

        return false;
    }

    private function copyDirectory(string $source, string $destination): void {
        if (!is_dir($source)) {
            throw new Exception("Source directory does not exist: {$source}");
        }

        if (!is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $destPath = $destination . DIRECTORY_SEPARATOR . $iterator->getSubPathName();

            if ($item->isDir()) {
                mkdir($destPath, 0755, true);
            } else {
                copy($item, $destPath);
            }
        }
    }
}
