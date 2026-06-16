<?php
/**
 * Voice Chat API Endpoint
 * Handles speech-to-speech processing with OpenAI and ElevenLabs
 */

require_once __DIR__ . '/_auth.php';
$auth = donna_cors_and_auth();
header('Content-Type: application/json');

require_once __DIR__ . '/../bootstrap_env.php';
require_once __DIR__ . '/../voice_system/openai_client.php';
require_once __DIR__ . '/../voice_system/elevenlabs_client.php';
require_once __DIR__ . '/../lib/ProviderFactory.php';

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST requests are allowed');
    }
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'speech_to_speech':
            handleSpeechToSpeech($input);
            break;
            
        case 'upload_audio':
            handleAudioUpload();
            break;
            
        case 'get_voices':
            handleGetVoices();
            break;
            
        case 'text_to_speech':
            handleTextToSpeech($input);
            break;

        case 'test_connection':
            handleTestConnection();
            break;
            
        case 'initiate_call':
            handleInitiateCall($input);
            break;
            
        case 'answer_call':
            handleAnswerCall($input);
            break;
            
        case 'hangup_call':
            handleHangupCall($input);
            break;
            
        case 'transfer_call':
            handleTransferCall($input);
            break;
            
        case 'get_call_status':
            handleGetCallStatus($input);
            break;
            
        case 'record_call':
            handleRecordCall($input);
            break;

        default:
            throw new Exception('Invalid action specified');
    }
    
} catch (Exception $e) {
    if (getenv('SENTRY_DSN')) {
        try { \Sentry\captureException($e); } catch (\Throwable $t) {}
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal error'
    ]);
}

/**
 * Handle speech-to-speech processing
 */
function handleSpeechToSpeech($input) {
    $audioData = $input['audio_data'] ?? '';
    $voiceId = $input['voice_id'] ?? null;
    $userId = $input['user_id'] ?? 'voice-user';
    
    if (!$audioData) {
        throw new Exception('Audio data is required');
    }
    
    // Initialize clients
    $openai = new OpenAIVoiceClient();
    $elevenlabs = new ElevenLabsClient();
    
    // Decode base64 audio data
    $audioBytes = base64_decode($audioData);
    $tempAudioFile = $openai->saveAudioToFile($audioBytes, 'input_' . uniqid() . '.wav');
    
    try {
        // Step 1: Convert speech to text using OpenAI Whisper
        $transcription = $openai->speechToText($tempAudioFile);
        $userMessage = $transcription['text'] ?? '';
        
        if (!$userMessage) {
            throw new Exception('Could not transcribe audio');
        }
        
        // Step 2: Process the message through DONNA logic
        $donnaResponse = processDonnaMessage($userMessage, $userId);
        
        // Step 3: Convert response to speech using ElevenLabs
        $audioResponse = $elevenlabs->textToSpeech($donnaResponse, $voiceId);
        
        // Step 4: Return the audio response (avoid unnecessary disk writes)
        $responseAudioData = base64_encode($audioResponse);
        
        // Clean up temporary files
        unlink($tempAudioFile);
        
        echo json_encode([
            'success' => true,
            'transcription' => $userMessage,
            'response_text' => $donnaResponse,
            'response_audio' => $responseAudioData,
            'audio_format' => 'mp3'
        ]);
        
    } catch (Exception $e) {
        // Clean up on error
        if (file_exists($tempAudioFile)) {
            unlink($tempAudioFile);
        }
        throw $e;
    }
}

/**
 * Handle text to speech conversion
 */
function handleTextToSpeech($input) {
    $text = $input['text'] ?? '';
    $voiceId = $input['voice_id'] ?? null;

    if (!$text) {
        throw new Exception('Text is required');
    }

    // Initialize ElevenLabs client
    $elevenlabs = new ElevenLabsClient();

    try {
        // Convert text to speech
        $audioResponse = $elevenlabs->textToSpeech($text, $voiceId);
        $responseAudioData = base64_encode($audioResponse);

        echo json_encode([
            'success' => true,
            'audio_data' => $responseAudioData,
            'audio_format' => 'mp3'
        ]);

    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Handle audio file upload
 */
function handleAudioUpload() {
    if (!isset($_FILES['audio'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No audio file uploaded']);
        return;
    }
    
    $uploadedFile = $_FILES['audio'];
    $voiceId = $_POST['voice_id'] ?? null;
    $userId = $_POST['user_id'] ?? 'voice-user';
    
    // Validate file (size and content-type)
    if (!isset($uploadedFile['error']) || $uploadedFile['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Upload failed']);
        return;
    }
    $maxBytes = 10 * 1024 * 1024; // 10MB
    if (($uploadedFile['size'] ?? 0) <= 0 || $uploadedFile['size'] > $maxBytes) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or too large audio file']);
        return;
    }
    if (!is_uploaded_file($uploadedFile['tmp_name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid upload']);
        return;
    }
    $fi = new finfo(FILEINFO_MIME_TYPE);
    $mime = $fi->file($uploadedFile['tmp_name']);
    $allowedTypes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    if (!in_array($mime, $allowedTypes, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid audio file type']);
        return;
    }
    
    // Initialize clients
    $openai = new OpenAIVoiceClient();
    $elevenlabs = new ElevenLabsClient();
    
    try {
        // Step 1: Convert speech to text
        $transcription = $openai->speechToText($uploadedFile['tmp_name']);
        $userMessage = $transcription['text'] ?? '';
        
        if (!$userMessage) {
            throw new Exception('Could not transcribe audio');
        }
        
        // Step 2: Process through DONNA
        $donnaResponse = processDonnaMessage($userMessage, $userId);
        
        // Step 3: Convert to speech
        $audioResponse = $elevenlabs->textToSpeech($donnaResponse, $voiceId);
        $responseAudioData = base64_encode($audioResponse);
        
        echo json_encode([
            'success' => true,
            'transcription' => $userMessage,
            'response_text' => $donnaResponse,
            'response_audio' => $responseAudioData,
            'audio_format' => 'mp3'
        ]);
        
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Get available voices from ElevenLabs
 */
function handleGetVoices() {
    $elevenlabs = new ElevenLabsClient();
    
    try {
        $voices = $elevenlabs->getVoices();
        $popularVoices = $elevenlabs->getPopularVoices();
        
        echo json_encode([
            'success' => true,
            'voices' => $voices,
            'popular_voices' => $popularVoices
        ]);
        
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Test API connections
 */
function handleTestConnection() {
    $results = [];
    
    // Test OpenAI connection
    try {
        $openai = new OpenAIVoiceClient();
        // Test with a simple completion
        $testResponse = $openai->getChatCompletion([
            ['role' => 'user', 'content' => 'Say hello']
        ]);
        $results['openai'] = [
            'status' => 'connected',
            'message' => 'OpenAI API is working'
        ];
    } catch (Exception $e) {
        $results['openai'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    // Test ElevenLabs connection
    try {
        $elevenlabs = new ElevenLabsClient();
        $userInfo = $elevenlabs->getUserInfo();
        $results['elevenlabs'] = [
            'status' => 'connected',
            'message' => 'ElevenLabs API is working',
            'user_info' => $userInfo
        ];
    } catch (Exception $e) {
        $results['elevenlabs'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    echo json_encode([
        'success' => true,
        'connections' => $results
    ]);
}

/**
 * Handle call initiation
 */
function handleInitiateCall($input) {
    $to = $input['to'] ?? '';
    $from = $input['from'] ?? null;
    $options = $input['options'] ?? [];
    
    if (!$to) {
        throw new Exception('Destination phone number is required');
    }
    
    try {
        $voiceProvider = ProviderFactory::createVoiceProvider();
        
        // Add webhook URL if configured
        if (getenv('TELNYX_WEBHOOK_URL')) {
            $options['webhook_url'] = getenv('TELNYX_WEBHOOK_URL');
        }
        
        $result = $voiceProvider->initiateCall($to, $from, $options);
        
        echo json_encode($result);
    } catch (Exception $e) {
        throw new Exception('Call initiation failed: ' . $e->getMessage());
    }
}

/**
 * Handle call answer
 */
function handleAnswerCall($input) {
    $callId = $input['call_id'] ?? '';
    
    if (!$callId) {
        throw new Exception('Call ID is required');
    }
    
    try {
        $voiceProvider = ProviderFactory::createVoiceProvider();
        $result = $voiceProvider->answerCall($callId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        throw new Exception('Call answer failed: ' . $e->getMessage());
    }
}

/**
 * Handle call hangup
 */
function handleHangupCall($input) {
    $callId = $input['call_id'] ?? '';
    
    if (!$callId) {
        throw new Exception('Call ID is required');
    }
    
    try {
        $voiceProvider = ProviderFactory::createVoiceProvider();
        $result = $voiceProvider->hangupCall($callId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        throw new Exception('Call hangup failed: ' . $e->getMessage());
    }
}

/**
 * Handle call transfer
 */
function handleTransferCall($input) {
    $callId = $input['call_id'] ?? '';
    $to = $input['to'] ?? '';
    
    if (!$callId || !$to) {
        throw new Exception('Call ID and destination number are required');
    }
    
    try {
        $voiceProvider = ProviderFactory::createVoiceProvider();
        $result = $voiceProvider->transferCall($callId, $to);
        
        echo json_encode($result);
    } catch (Exception $e) {
        throw new Exception('Call transfer failed: ' . $e->getMessage());
    }
}

/**
 * Handle get call status
 */
function handleGetCallStatus($input) {
    $callId = $input['call_id'] ?? '';
    
    if (!$callId) {
        throw new Exception('Call ID is required');
    }
    
    try {
        $voiceProvider = ProviderFactory::createVoiceProvider();
        $result = $voiceProvider->getCallStatus($callId);
        
        echo json_encode($result);
    } catch (Exception $e) {
        throw new Exception('Get call status failed: ' . $e->getMessage());
    }
}

/**
 * Handle call recording toggle
 */
function handleRecordCall($input) {
    $callId = $input['call_id'] ?? '';
    $enabled = $input['enabled'] ?? true;
    
    if (!$callId) {
        throw new Exception('Call ID is required');
    }
    
    try {
        $voiceProvider = ProviderFactory::createVoiceProvider();
        $result = $voiceProvider->recordCall($callId, (bool)$enabled);
        
        echo json_encode($result);
    } catch (Exception $e) {
        throw new Exception('Call recording toggle failed: ' . $e->getMessage());
    }
}

/**
 * Process message through DONNA logic
 */
function processDonnaMessage($message, $userId) {
    // Check if donna_logic.php exists and has the right function
    if (function_exists('processMessage')) {
        return processMessage($message, $userId);
    } elseif (function_exists('process_message')) {
        return process_message($message, $userId);
    } else {
        // Fallback to simple response
        return "I heard you say: \"$message\". I'm DONNA, your AI assistant. How can I help you today? 🧠";
    }
}
