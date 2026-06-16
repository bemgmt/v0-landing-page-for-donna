<?php
/**
 * ElevenLabs API Client for Voice Synthesis
 * Provides high-quality voice synthesis with custom voices
 */

class ElevenLabsClient {
    private $apiKey;
    private $baseUrl = 'https://api.elevenlabs.io/v1';
    private $timeout = 30;
    
    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: getenv('ELEVENLABS_API_KEY');
        
        if (!$this->apiKey) {
            throw new Exception('ElevenLabs API key is required');
        }
    }
    
    /**
     * Get available voices
     */
    public function getVoices() {
        $url = $this->baseUrl . '/voices';
        return $this->makeRequest($url, null, 'GET');
    }
    
    /**
     * Convert text to speech
     */
    public function textToSpeech($text, $voiceId = null, $options = []) {
        // Default voice ID (Rachel - a popular female voice)
        $voiceId = $voiceId ?: '21m00Tcm4TlvDq8ikWAM';
        
        $url = $this->baseUrl . "/text-to-speech/$voiceId";
        
        $defaultOptions = [
            'text' => $text,
            'model_id' => 'eleven_monolingual_v1',
            'voice_settings' => [
                'stability' => 0.5,
                'similarity_boost' => 0.5,
                'style' => 0.0,
                'use_speaker_boost' => true
            ]
        ];
        
        $requestData = array_merge($defaultOptions, $options);
        
        return $this->makeRequest($url, $requestData, 'POST', true);
    }
    
    /**
     * Convert text to speech with streaming
     */
    public function textToSpeechStream($text, $voiceId = null, $options = []) {
        $voiceId = $voiceId ?: '21m00Tcm4TlvDq8ikWAM';
        
        $url = $this->baseUrl . "/text-to-speech/$voiceId/stream";
        
        $defaultOptions = [
            'text' => $text,
            'model_id' => 'eleven_monolingual_v1',
            'voice_settings' => [
                'stability' => 0.5,
                'similarity_boost' => 0.5,
                'style' => 0.0,
                'use_speaker_boost' => true
            ]
        ];
        
        $requestData = array_merge($defaultOptions, $options);
        
        return $this->makeRequest($url, $requestData, 'POST', true);
    }
    
    /**
     * Get voice details
     */
    public function getVoice($voiceId) {
        $url = $this->baseUrl . "/voices/$voiceId";
        return $this->makeRequest($url, null, 'GET');
    }
    
    /**
     * Get user subscription info
     */
    public function getUserInfo() {
        $url = $this->baseUrl . '/user';
        return $this->makeRequest($url, null, 'GET');
    }
    
    /**
     * Clone a voice (if available in subscription)
     */
    public function cloneVoice($name, $description, $files, $labels = []) {
        $url = $this->baseUrl . '/voices/add';
        
        $postFields = [
            'name' => $name,
            'description' => $description,
            'labels' => json_encode($labels)
        ];
        
        // Add audio files
        foreach ($files as $index => $file) {
            $postFields["files[$index]"] = new CURLFile($file);
        }
        
        return $this->makeRequest($url, $postFields, 'POST', false, true);
    }
    
    /**
     * Make HTTP request to ElevenLabs API
     */
    private function makeRequest($url, $data = null, $method = 'GET', $isBinary = false, $isMultipart = false) {
        $ch = curl_init();
        
        $headers = [
            'xi-api-key: ' . $this->apiKey,
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => $headers
        ]);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            
            if ($isMultipart) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            } elseif ($data) {
                $headers[] = 'Content-Type: application/json';
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            }
        }
        
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
            $errorMessage = $decodedResponse['detail'] ?? 'Unknown error';
            throw new Exception("ElevenLabs API error (HTTP $httpCode): $errorMessage");
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
     * Get popular voice IDs for quick reference
     */
    public function getPopularVoices() {
        return [
            'rachel' => '21m00Tcm4TlvDq8ikWAM',      // Female, American
            'drew' => '29vD33N1CtxCmqQRPOHJ',        // Male, American
            'clyde' => '2EiwWnXFnvU5JabPnv8n',       // Male, American
            'paul' => '5Q0t7uMcjvnagumLfvZi',        // Male, American
            'domi' => 'AZnzlk1XvdvUeBnXmlld',        // Female, American
            'dave' => 'CYw3kZ02Hs0563khs1Fj',        // Male, British
            'fin' => 'D38z5RcWu1voky8WS1ja',         // Male, Irish
            'sarah' => 'EXAVITQu4vr4xnSDxMaL',       // Female, American
            'antoni' => 'ErXwobaYiN019PkySvjV',       // Male, American
            'thomas' => 'GBv7mTt0atIp3Br8iCZE',      // Male, American
            'charlie' => 'IKne3meq5aSn9XLyUdCD',     // Male, Australian
            'george' => 'JBFqnCBsd6RMkjVDRZzb',      // Male, British
            'callum' => 'N2lVS1w4EtoT3dr4eOWO',      // Male, American
            'liam' => 'TX3LPaxmHKxFdv7VOQHJ',        // Male, American
            'charlotte' => 'XB0fDUnXU5powFXDhCwa',   // Female, English
            'alice' => 'Xb7hH8MSUJpSbSDYk0k2',       // Female, British
            'matilda' => 'XrExE9yKIg1WjnnlVkGX',     // Female, American
            'james' => 'ZQe5CqHNLWdVhgzdhyYE',       // Male, Australian
            'joseph' => 'Zlb1dXrM653N07WRdFW3',      // Male, British
            'jeremy' => 'bVMeCyTHy58xNoL34h3p',      // Male, American
            'michael' => 'flq6f7yk4E4fJM5XTYuZ',     // Male, American
            'ethan' => 'g5CIjZEefAph4nQFvHAz',       // Male, American
            'gigi' => 'jBpfuIE2acCO8z3wKNLl',        // Female, American
            'freya' => 'jsCqWAovK2LkecY7zXl4',       // Female, American
            'brian' => 'nPczCjzI2devNBz1zQrb',       // Male, American
            'grace' => 'oWAxZDx7w5VEj9dCyTzz',       // Female, American
            'daniel' => 'onwK4e9ZLuTAKqWW03F9',      // Male, British
            'lily' => 'pFZP5JQG7iQjIQuC4Bku',        // Female, British
            'serena' => 'pMsXgVXv3BLzUgSXRplE',      // Female, American
            'adam' => 'pNInz6obpgDQGcFmaJgB',        // Male, American
            'nicole' => 'piTKgcLEGmPE4e6mEKli',      // Female, American
            'jessie' => 't0jbNlBVZ17f02VDIeMI',      // Male, American
            'ryan' => 'wViXBPUzp2ZZixB1xQuM',        // Male, American
            'sam' => 'yoZ06aMxZJJ28mfd3POQ',          // Male, American
            'glinda' => 'z9fAnlkpzviPz146aGWa'        // Female, American
        ];
    }
}
