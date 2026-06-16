<?php
/**
 * OpenAI Realtime API Client
 * WebSocket-based client for real-time speech-to-speech processing
 */

require_once __DIR__ . '/vendor/autoload.php'; // For WebSocket client

class OpenAIRealtimeClient {
    private $apiKey;
    private $wsUrl = 'wss://api.openai.com/v1/realtime';
    private $model;
    private $sessionConfig;
    
    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: getenv('OPENAI_API_KEY');
        $this->model = getenv('OPENAI_REALTIME_MODEL') ?: 'gpt-4o-realtime-preview-2024-10-01';

        if (!$this->apiKey) {
            throw new Exception('OpenAI API key is required');
        }

        $this->sessionConfig = [
            'model' => $this->model,
            'modalities' => ['text', 'audio'],
            'instructions' => 'You are DONNA, a helpful AI receptionist. Be professional, friendly, and concise. Handle calls efficiently and provide excellent customer service.',
            'voice' => 'alloy',
            'input_audio_format' => 'pcm16',
            'output_audio_format' => 'pcm16',
            'input_audio_transcription' => [
                'model' => 'whisper-1'
            ],
            'turn_detection' => [
                'type' => 'server_vad',
                'threshold' => 0.5,
                'prefix_padding_ms' => 300,
                'silence_duration_ms' => 200
            ],
            'tools' => [],
            'tool_choice' => 'auto',
            'temperature' => 0.8,
            'max_response_output_tokens' => 4096
        ];
    }
    
    /**
     * Create a new realtime session
     */
    public function createSession($customConfig = []) {
        $config = array_merge($this->sessionConfig, $customConfig);
        
        // For now, return session config - WebSocket implementation would go here
        return [
            'session_id' => uniqid('session_'),
            'config' => $config,
            'ws_url' => $this->wsUrl . '?model=' . $this->model,
            'headers' => [
                'Authorization: Bearer ' . $this->apiKey,
                'OpenAI-Beta: realtime=v1'
            ]
        ];
    }
    
    /**
     * Handle WebSocket connection (placeholder for actual implementation)
     */
    public function connectWebSocket($sessionId) {
        // This would implement the actual WebSocket connection
        // For now, return connection info
        return [
            'session_id' => $sessionId,
            'status' => 'connected',
            'ws_url' => $this->wsUrl,
            'message' => 'WebSocket connection established'
        ];
    }
    
    /**
     * Send audio data to realtime API
     */
    public function sendAudio($audioData, $sessionId) {
        // Convert audio to base64 PCM16
        $audioBase64 = base64_encode($audioData);
        
        $message = [
            'type' => 'input_audio_buffer.append',
            'audio' => $audioBase64
        ];
        
        return $message;
    }
    
    /**
     * Commit audio buffer
     */
    public function commitAudio($sessionId) {
        return [
            'type' => 'input_audio_buffer.commit'
        ];
    }
    
    /**
     * Create response
     */
    public function createResponse($sessionId, $config = []) {
        $defaultConfig = [
            'modalities' => ['text', 'audio'],
            'instructions' => null,
            'voice' => 'alloy',
            'output_audio_format' => 'pcm16',
            'tools' => [],
            'tool_choice' => 'auto',
            'temperature' => 0.8,
            'max_output_tokens' => null
        ];
        
        $responseConfig = array_merge($defaultConfig, $config);
        
        return [
            'type' => 'response.create',
            'response' => $responseConfig
        ];
    }
    
    /**
     * Cancel response
     */
    public function cancelResponse($sessionId) {
        return [
            'type' => 'response.cancel'
        ];
    }
    
    /**
     * Update session configuration
     */
    public function updateSession($sessionId, $config) {
        return [
            'type' => 'session.update',
            'session' => $config
        ];
    }
    
    /**
     * Add conversation item
     */
    public function addConversationItem($sessionId, $item) {
        return [
            'type' => 'conversation.item.create',
            'item' => $item
        ];
    }
    
    /**
     * Truncate conversation
     */
    public function truncateConversation($sessionId, $itemId, $contentIndex, $audioEndMs) {
        return [
            'type' => 'conversation.item.truncate',
            'item_id' => $itemId,
            'content_index' => $contentIndex,
            'audio_end_ms' => $audioEndMs
        ];
    }
    
    /**
     * Delete conversation item
     */
    public function deleteConversationItem($sessionId, $itemId) {
        return [
            'type' => 'conversation.item.delete',
            'item_id' => $itemId
        ];
    }
    
    /**
     * Process incoming WebSocket message
     */
    public function processMessage($message) {
        $data = json_decode($message, true);
        
        if (!$data || !isset($data['type'])) {
            return ['error' => 'Invalid message format'];
        }
        
        switch ($data['type']) {
            case 'session.created':
                return [
                    'type' => 'session_created',
                    'session' => $data['session']
                ];
                
            case 'session.updated':
                return [
                    'type' => 'session_updated',
                    'session' => $data['session']
                ];
                
            case 'input_audio_buffer.committed':
                return [
                    'type' => 'audio_committed',
                    'item_id' => $data['item_id'] ?? null
                ];
                
            case 'input_audio_buffer.speech_started':
                return [
                    'type' => 'speech_started',
                    'audio_start_ms' => $data['audio_start_ms'] ?? 0,
                    'item_id' => $data['item_id'] ?? null
                ];
                
            case 'input_audio_buffer.speech_stopped':
                return [
                    'type' => 'speech_stopped',
                    'audio_end_ms' => $data['audio_end_ms'] ?? 0,
                    'item_id' => $data['item_id'] ?? null
                ];
                
            case 'conversation.item.created':
                return [
                    'type' => 'item_created',
                    'item' => $data['item']
                ];
                
            case 'response.created':
                return [
                    'type' => 'response_created',
                    'response' => $data['response']
                ];
                
            case 'response.output_item.added':
                return [
                    'type' => 'output_item_added',
                    'item' => $data['item'],
                    'output_index' => $data['output_index'] ?? 0
                ];
                
            case 'response.content_part.added':
                return [
                    'type' => 'content_part_added',
                    'part' => $data['part'],
                    'item_id' => $data['item_id'],
                    'output_index' => $data['output_index'] ?? 0,
                    'content_index' => $data['content_index'] ?? 0
                ];
                
            case 'response.audio_transcript.delta':
                return [
                    'type' => 'audio_transcript_delta',
                    'delta' => $data['delta'],
                    'item_id' => $data['item_id'],
                    'output_index' => $data['output_index'] ?? 0,
                    'content_index' => $data['content_index'] ?? 0
                ];
                
            case 'response.audio.delta':
                return [
                    'type' => 'audio_delta',
                    'delta' => $data['delta'], // Base64 encoded audio
                    'item_id' => $data['item_id'],
                    'output_index' => $data['output_index'] ?? 0,
                    'content_index' => $data['content_index'] ?? 0
                ];
                
            case 'response.done':
                return [
                    'type' => 'response_done',
                    'response' => $data['response']
                ];
                
            case 'error':
                return [
                    'type' => 'error',
                    'error' => $data['error']
                ];
                
            default:
                return [
                    'type' => 'unknown',
                    'original_type' => $data['type'],
                    'data' => $data
                ];
        }
    }
    
    /**
     * Convert audio format (helper function)
     */
    public function convertAudioFormat($audioData, $fromFormat, $toFormat) {
        // This would implement audio format conversion
        // For now, return the data as-is
        return $audioData;
    }
    
    /**
     * Get session configuration
     */
    public function getSessionConfig() {
        return $this->sessionConfig;
    }
    
    /**
     * Update session configuration
     */
    public function setSessionConfig($config) {
        $this->sessionConfig = array_merge($this->sessionConfig, $config);
    }
}
