<?php
/**
 * OpenAI API Client for Speech-to-Speech Integration
 * Supports both Realtime API and traditional Whisper + TTS pipeline
 */

class OpenAIVoiceClient {
    private $apiKey;
    private $baseUrl = 'https://api.openai.com/v1';
    private $timeout = 30;
    
    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: getenv('OPENAI_API_KEY');
        
        if (!$this->apiKey) {
            throw new Exception('OpenAI API key is required');
        }
    }
    
    /**
     * Convert speech to text using Whisper
     */
    public function speechToText($audioFile, $model = 'whisper-1') {
        $url = $this->baseUrl . '/audio/transcriptions';
        
        $postFields = [
            'file' => new CURLFile($audioFile),
            'model' => $model,
            'response_format' => 'json'
        ];
        
        return $this->makeRequest($url, $postFields, true);
    }
    
    /**
     * Convert text to speech using TTS
     */
    public function textToSpeech($text, $voice = 'alloy', $model = 'tts-1') {
        $url = $this->baseUrl . '/audio/speech';
        
        $data = [
            'model' => $model,
            'input' => $text,
            'voice' => $voice,
            'response_format' => 'mp3'
        ];
        
        return $this->makeRequest($url, $data, false, true);
    }
    
    /**
     * Get chat completion (for processing transcribed text)
     */
    public function getChatCompletion($messages, $model = 'gpt-4') {
        $url = $this->baseUrl . '/chat/completions';
        
        $data = [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => 1000,
            'temperature' => 0.7
        ];
        
        return $this->makeRequest($url, $data);
    }
    
    /**
     * Create a Realtime session (for real-time speech-to-speech)
     */
    public function createRealtimeSession($config = []) {
        $url = 'https://api.openai.com/v1/realtime/sessions';
        
        $defaultConfig = [
            'model' => 'gpt-4o-realtime-preview',
            'modalities' => ['text', 'audio'],
            'instructions' => 'You are DONNA, a helpful AI assistant. Respond naturally and conversationally.',
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
            ]
        ];
        
        $sessionConfig = array_merge($defaultConfig, $config);
        
        return $this->makeRequest($url, $sessionConfig);
    }
    
    /**
     * Make HTTP request to OpenAI API
     */
    private function makeRequest($url, $data, $isMultipart = false, $isBinary = false) {
        $ch = curl_init();
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
        ];
        
        if ($isMultipart) {
            // For file uploads
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        } else {
            // For JSON requests
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        if ($isBinary) {
            curl_setopt($ch, CURLOPT_BINARYTRANSFER, true);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }
        
        if ($isBinary && $httpCode === 200) {
            return $response; // Return raw audio data
        }
        
        $decodedResponse = json_decode($response, true);
        
        if ($httpCode !== 200) {
            $errorMessage = $decodedResponse['error']['message'] ?? 'Unknown error';
            throw new Exception("OpenAI API error (HTTP $httpCode): $errorMessage");
        }
        
        return $decodedResponse;
    }
    
    /**
     * Save audio data to file
     */
    public function saveAudioToFile($audioData, $filename) {
        $audioDir = __DIR__ . '/temp_audio';
        if (!is_dir($audioDir)) {
            mkdir($audioDir, 0755, true);
        }
        
        $filepath = $audioDir . '/' . $filename;
        file_put_contents($filepath, $audioData);
        
        return $filepath;
    }
    
    /**
     * Clean up temporary audio files
     */
    public function cleanupTempFiles($olderThanMinutes = 60) {
        $audioDir = __DIR__ . '/temp_audio';
        if (!is_dir($audioDir)) {
            return;
        }
        
        $files = glob($audioDir . '/*');
        $cutoff = time() - ($olderThanMinutes * 60);
        
        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoff) {
                unlink($file);
            }
        }
    }
}
