<?php
/**
 * WebSocket proxy for OpenAI Realtime API
 * Handles WebSocket connections between frontend and OpenAI Realtime API
 */

require_once __DIR__ . '/_auth.php';
$auth = donna_cors_and_auth();
header('Content-Type: application/json');


require_once __DIR__ . '/../bootstrap_env.php';

require_once __DIR__ . '/../voice_system/openai_realtime_client.php';

try {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'create_session':
            handleCreateSession();
            break;

        case 'get_websocket_url':
            handleGetWebSocketUrl();
            break;

        case 'process_message':
            handleProcessMessage();
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
        'error' => $e->getMessage()
    ]);
}

/**
 * Create a new Realtime API session
 */
function handleCreateSession() {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $customConfig = $input['config'] ?? [];

    // Initialize Realtime client
    $realtimeClient = new OpenAIRealtimeClient();

    // Create session
    $session = $realtimeClient->createSession($customConfig);

    echo json_encode([
        'success' => true,
        'session' => $session
    ]);
}

/**
 * Get WebSocket connection URL and headers
 */
function handleGetWebSocketUrl() {
    $sessionId = $_GET['session_id'] ?? '';

    if (!$sessionId) {
        throw new Exception('Session ID is required');
    }

    $realtimeClient = new OpenAIRealtimeClient();
    $connection = $realtimeClient->connectWebSocket($sessionId);

    echo json_encode([
        'success' => true,
        'connection' => $connection,
        'websocket_url' => 'wss://api.openai.com/v1/realtime?model=' . (getenv('OPENAI_REALTIME_MODEL') ?: 'gpt-4o-realtime-preview-2024-10-01')
        // NOTE: Do not expose server OPENAI_API_KEY to clients. Use an ephemeral token minted server-side
        // via Next.js /api/realtime/token or a server-side WS proxy.
    ]);
}

/**
 * Process WebSocket message
 */
function handleProcessMessage() {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = $input['message'] ?? '';

    if (!$message) {
        throw new Exception('Message is required');
    }

    $realtimeClient = new OpenAIRealtimeClient();
    $processed = $realtimeClient->processMessage($message);

    echo json_encode([
        'success' => true,
        'processed_message' => $processed
    ]);
}

/**
 * WebSocket message templates for common operations
 */
function getMessageTemplates() {
    return [
        'session_update' => [
            'type' => 'session.update',
            'session' => [
                'modalities' => ['text', 'audio'],
                'instructions' => 'You are DONNA, a helpful AI receptionist.',
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
                'temperature' => 0.8,
                'max_response_output_tokens' => 4096
            ]
        ],

        'audio_append' => [
            'type' => 'input_audio_buffer.append',
            'audio' => '' // Base64 encoded PCM16 audio
        ],

        'audio_commit' => [
            'type' => 'input_audio_buffer.commit'
        ],

        'response_create' => [
            'type' => 'response.create',
            'response' => [
                'modalities' => ['text', 'audio'],
                'instructions' => null,
                'voice' => 'alloy',
                'output_audio_format' => 'pcm16',
                'temperature' => 0.8
            ]
        ],

        'response_cancel' => [
            'type' => 'response.cancel'
        ],

        'conversation_item_create' => [
            'type' => 'conversation.item.create',
            'item' => [
                'type' => 'message',
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'input_text',
                        'text' => ''
                    ]
                ]
            ]
        ]
    ];
}

// If called directly, return available templates
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($_GET['action'])) {
    echo json_encode([
        'success' => true,
        'message' => 'OpenAI Realtime API WebSocket Proxy',
        'available_actions' => [
            'create_session',
            'get_websocket_url',
            'process_message'
        ],
        'message_templates' => getMessageTemplates(),
        'websocket_url' => 'wss://api.openai.com/v1/realtime?model=' . (getenv('OPENAI_REALTIME_MODEL') ?: 'gpt-4o-realtime-preview-2024-10-01'),
        'required_headers' => [
            'Authorization: Bearer <ephemeral_token>',
            'OpenAI-Beta: realtime=v1'
        ]
    ]);
}
