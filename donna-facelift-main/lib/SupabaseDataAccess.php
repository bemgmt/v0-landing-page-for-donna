<?php
/**
 * Supabase-specific implementation of DataAccessInterface
 * Provides better integration with Supabase features like RLS, real-time subscriptions, and edge functions
 */

require_once __DIR__ . '/DataAccessInterface.php';

class SupabaseDataAccess implements DataAccessInterface {
    private $supabaseUrl;
    private $serviceRoleKey;
    private $anonKey;
    private $httpClient;
    private $retryAttempts = 3;
    private $retryDelay = 1; // seconds

    public function __construct() {
        $this->supabaseUrl = $_ENV['SUPABASE_URL'] ?? '';
        $this->serviceRoleKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? '';
        $this->anonKey = $_ENV['SUPABASE_ANON_KEY'] ?? '';
        
        if (empty($this->supabaseUrl) || empty($this->serviceRoleKey)) {
            throw new Exception('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        }
        
        $this->initializeHttpClient();
    }

    private function initializeHttpClient() {
        // Initialize cURL with default options
        $this->httpClient = curl_init();
        curl_setopt_array($this->httpClient, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Donna-Interactive/1.0 SupabaseDataAccess'
        ]);
    }

    private function makeRequest($method, $endpoint, $data = null, $useServiceRole = true) {
        $url = rtrim($this->supabaseUrl, '/') . '/rest/v1/' . ltrim($endpoint, '/');
        
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
            'apikey: ' . ($useServiceRole ? $this->serviceRoleKey : $this->anonKey)
        ];
        
        if ($useServiceRole) {
            $headers[] = 'Authorization: Bearer ' . $this->serviceRoleKey;
        }

        for ($attempt = 1; $attempt <= $this->retryAttempts; $attempt++) {
            curl_setopt_array($this->httpClient, [
                CURLOPT_URL => $url,
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_POSTFIELDS => $data ? json_encode($data) : null
            ]);

            $response = curl_exec($this->httpClient);
            $httpCode = curl_getinfo($this->httpClient, CURLINFO_HTTP_CODE);
            $error = curl_error($this->httpClient);

            if ($error) {
                if ($attempt < $this->retryAttempts) {
                    sleep($this->retryDelay * $attempt);
                    continue;
                }
                throw new Exception("cURL error: $error");
            }

            if ($httpCode >= 200 && $httpCode < 300) {
                return json_decode($response, true);
            }

            if ($httpCode >= 400 && $httpCode < 500) {
                // Client error - don't retry
                $errorData = json_decode($response, true);
                $message = $errorData['message'] ?? "HTTP $httpCode error";
                throw new Exception("Supabase API error: $message");
            }

            if ($attempt < $this->retryAttempts) {
                sleep($this->retryDelay * $attempt);
            }
        }

        throw new Exception("Request failed after {$this->retryAttempts} attempts. HTTP code: $httpCode");
    }

    public function testConnection() {
        try {
            $this->makeRequest('GET', 'users?limit=1');
            return true;
        } catch (Exception $e) {
            throw new Exception("Supabase connection test failed: " . $e->getMessage());
        }
    }

    // User Management
    public function createUser($email, $password = null, $additionalData = []) {
        $userData = array_merge([
            'email' => $email,
            'created_at' => date('c'),
            'status' => 'active',
            'profile' => (object)[],
            'preferences' => (object)[]
        ], $additionalData);

        $result = $this->makeRequest('POST', 'users', $userData);
        return $result[0] ?? $result;
    }

    public function getUserByEmail($email) {
        $result = $this->makeRequest('GET', "users?email=eq.$email&limit=1");
        return !empty($result) ? $result[0] : null;
    }

    public function getUserById($userId) {
        $result = $this->makeRequest('GET', "users?id=eq.$userId&limit=1");
        return !empty($result) ? $result[0] : null;
    }

    public function updateUser($userId, $data) {
        $data['updated_at'] = date('c');
        $result = $this->makeRequest('PATCH', "users?id=eq.$userId", $data);
        return !empty($result);
    }

    public function deleteUser($userId) {
        $this->makeRequest('DELETE', "users?id=eq.$userId");
        return true;
    }

    public function getAllUsers() {
        return $this->makeRequest('GET', 'users?order=created_at.desc');
    }

    // Chat Session Management
    public function createChatSession($userId, $sessionData = []) {
        $chatData = array_merge([
            'user_id' => $userId,
            'created_at' => date('c'),
            'status' => 'active',
            'message_count' => 0,
            'metadata' => (object)[]
        ], $sessionData);

        $result = $this->makeRequest('POST', 'chat_sessions', $chatData);
        return $result[0] ?? $result;
    }

    public function getChatSession($sessionId) {
        $result = $this->makeRequest('GET', "chat_sessions?id=eq.$sessionId&limit=1");
        return !empty($result) ? $result[0] : null;
    }

    public function updateChatSession($sessionId, $data) {
        $data['updated_at'] = date('c');
        $result = $this->makeRequest('PATCH', "chat_sessions?id=eq.$sessionId", $data);
        return !empty($result);
    }

    public function deleteChatSession($sessionId) {
        // Delete messages first (cascade)
        $this->makeRequest('DELETE', "messages?chat_session_id=eq.$sessionId");
        // Delete session
        $this->makeRequest('DELETE', "chat_sessions?id=eq.$sessionId");
        return true;
    }

    public function getUserChatSessions($userId) {
        return $this->makeRequest('GET', "chat_sessions?user_id=eq.$userId&order=created_at.desc");
    }

    // Message Management
    public function addMessage($sessionId, $role, $content, $metadata = []) {
        $messageData = [
            'chat_session_id' => $sessionId,
            'role' => $role,
            'content' => $content,
            'created_at' => date('c'),
            'metadata' => (object)$metadata,
            'token_count' => $this->estimateTokenCount($content),
            'abuse_flagged' => false
        ];

        $result = $this->makeRequest('POST', 'messages', $messageData);
        return $result[0] ?? $result;
    }

    public function getChatMessages($sessionId, $limit = null) {
        $endpoint = "messages?chat_session_id=eq.$sessionId&order=sequence_number.asc";
        if ($limit) {
            $endpoint .= "&limit=$limit";
        }
        return $this->makeRequest('GET', $endpoint);
    }

    public function updateMessage($messageId, $data) {
        $data['updated_at'] = date('c');
        $result = $this->makeRequest('PATCH', "messages?id=eq.$messageId", $data);
        return !empty($result);
    }

    public function deleteMessage($messageId) {
        $this->makeRequest('DELETE', "messages?id=eq.$messageId");
        return true;
    }

    // User Memory Management
    public function setUserMemory($userId, $key, $value, $memoryType = 'general', $expiresAt = null) {
        // Check if memory already exists
        $existing = $this->makeRequest('GET', "user_memory?user_id=eq.$userId&memory_key=eq.$key&limit=1");
        
        $memoryData = [
            'user_id' => $userId,
            'memory_key' => $key,
            'memory_value' => is_string($value) ? $value : json_encode($value),
            'memory_type' => $memoryType,
            'expires_at' => $expiresAt,
            'updated_at' => date('c')
        ];

        if (!empty($existing)) {
            // Update existing
            $result = $this->makeRequest('PATCH', "user_memory?user_id=eq.$userId&memory_key=eq.$key", $memoryData);
        } else {
            // Create new
            $memoryData['created_at'] = date('c');
            $result = $this->makeRequest('POST', 'user_memory', $memoryData);
        }

        return !empty($result);
    }

    public function getUserMemory($userId, $key = null) {
        if ($key) {
            $result = $this->makeRequest('GET', "user_memory?user_id=eq.$userId&memory_key=eq.$key&limit=1");
            if (!empty($result)) {
                $memory = $result[0];
                return $this->parseMemoryValue($memory['memory_value']);
            }
            return null;
        } else {
            $result = $this->makeRequest('GET', "user_memory?user_id=eq.$userId&order=created_at.desc");
            $memories = [];
            foreach ($result as $memory) {
                $memories[$memory['memory_key']] = $this->parseMemoryValue($memory['memory_value']);
            }
            return $memories;
        }
    }

    public function deleteUserMemory($userId, $key) {
        $this->makeRequest('DELETE', "user_memory?user_id=eq.$userId&memory_key=eq.$key");
        return true;
    }

    // Utility Methods
    private function parseMemoryValue($value) {
        $decoded = json_decode($value, true);
        return $decoded !== null ? $decoded : $value;
    }

    private function estimateTokenCount($text) {
        // Simple token estimation (roughly 4 characters per token)
        return max(1, intval(strlen($text) / 4));
    }

    // Supabase-specific features
    public function enableRealTimeSubscription($table, $callback) {
        // This would require WebSocket implementation
        // For now, return a placeholder
        throw new Exception("Real-time subscriptions require WebSocket implementation");
    }

    public function callEdgeFunction($functionName, $data = []) {
        $url = rtrim($this->supabaseUrl, '/') . '/functions/v1/' . $functionName;
        
        curl_setopt_array($this->httpClient, [
            CURLOPT_URL => $url,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->serviceRoleKey
            ],
            CURLOPT_POSTFIELDS => json_encode($data)
        ]);

        $response = curl_exec($this->httpClient);
        $httpCode = curl_getinfo($this->httpClient, CURLINFO_HTTP_CODE);

        if ($httpCode >= 200 && $httpCode < 300) {
            return json_decode($response, true);
        }

        throw new Exception("Edge function call failed: HTTP $httpCode");
    }

    public function cleanupExpiredMemory() {
        // Call the database function
        $result = $this->makeRequest('POST', 'rpc/cleanup_expired_memory');
        return $result['result'] ?? 0;
    }

    public function __destruct() {
        if ($this->httpClient) {
            curl_close($this->httpClient);
        }
    }
}
?>
