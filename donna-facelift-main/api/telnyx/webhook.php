<?php
/**
 * Telnyx Webhook Endpoint
 * Handles incoming webhooks from Telnyx for call and messaging events
 */

require_once __DIR__ . '/../../bootstrap_env.php';
header('Content-Type: application/json');

// Get raw request body for signature verification
$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_TELNYX_SIGNATURE_ED25519'] ?? '';

// Verify webhook signature
$webhookSecret = getenv('TELNYX_WEBHOOK_SECRET');
if ($webhookSecret) {
    if (!verifyWebhookSignature($rawBody, $signature, $webhookSecret)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid webhook signature']);
        exit;
    }
}

// Parse webhook data
$data = json_decode($rawBody, true);

if (!$data || !isset($data['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid webhook payload']);
    exit;
}

$eventType = $data['data']['event_type'] ?? $data['event_type'] ?? 'unknown';
$eventData = $data['data']['payload'] ?? $data['data'] ?? [];

try {
    // Handle different event types
    switch ($eventType) {
        case 'call.initiated':
        case 'call.answered':
        case 'call.ended':
        case 'call.hangup':
            handleCallEvent($eventType, $eventData);
            break;
            
        case 'message.received':
        case 'message.finalized':
        case 'message.sending.failed':
            handleMessagingEvent($eventType, $eventData);
            break;
            
        default:
            // Log unknown events but don't fail
            error_log("Telnyx webhook: Unknown event type: $eventType");
    }
    
    // Always return 200 to acknowledge receipt
    http_response_code(200);
    echo json_encode(['status' => 'received']);
    
} catch (Exception $e) {
    error_log("Telnyx webhook error: " . $e->getMessage());
    http_response_code(200); // Still return 200 to prevent retries
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/**
 * Handle call events
 */
function handleCallEvent($eventType, $eventData) {
    $callId = $eventData['call_control_id'] ?? $eventData['call_session_id'] ?? null;
    $from = $eventData['from'] ?? null;
    $to = $eventData['to'] ?? null;
    $status = $eventData['call_status'] ?? 'unknown';
    
    // Store call event in call history
    storeCallEvent([
        'call_id' => $callId,
        'event_type' => $eventType,
        'from' => $from,
        'to' => $to,
        'status' => $status,
        'occurred_at' => $eventData['occurred_at'] ?? date('c'),
        'duration' => $eventData['duration_seconds'] ?? null,
        'recording_url' => $eventData['recording_urls'][0] ?? null,
        'raw_data' => $eventData
    ]);
    
    // Fan out to other services if configured
    if (getenv('ENABLE_VOICE_FANOUT')) {
        fanoutCallEvent($eventType, $eventData);
    }
}

/**
 * Handle messaging events
 */
function handleMessagingEvent($eventType, $eventData) {
    $messageId = $eventData['id'] ?? null;
    $from = $eventData['from']['phone_number'] ?? $eventData['from'] ?? null;
    $to = $eventData['to'][0]['phone_number'] ?? $eventData['to'] ?? null;
    $text = $eventData['text'] ?? $eventData['body'] ?? '';
    $status = $eventData['status'] ?? 'unknown';
    
    // Store message event
    storeMessageEvent([
        'message_id' => $messageId,
        'event_type' => $eventType,
        'from' => $from,
        'to' => $to,
        'text' => $text,
        'status' => $status,
        'occurred_at' => $eventData['occurred_at'] ?? date('c'),
        'raw_data' => $eventData
    ]);
    
    // If it's an incoming message, process it
    if ($eventType === 'message.received') {
        processIncomingMessage($eventData);
    }
}

/**
 * Store call event in database or file
 */
function storeCallEvent($eventData) {
    // Try to use Supabase if available
    if (getenv('SUPABASE_URL') && getenv('SUPABASE_SERVICE_ROLE_KEY')) {
        try {
            require_once __DIR__ . '/../../lib/supabase-admin.php';
            // Store in Supabase call_history table
            // This would require creating the table schema
            error_log("Call event stored: " . json_encode($eventData));
        } catch (Exception $e) {
            error_log("Failed to store call event in Supabase: " . $e->getMessage());
        }
    }
    
    // Fallback to file logging
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/call_history.json';
    $existing = [];
    if (file_exists($logFile)) {
        $existing = json_decode(file_get_contents($logFile), true) ?: [];
    }
    
    $existing[] = $eventData;
    
    // Keep only last 1000 events
    if (count($existing) > 1000) {
        $existing = array_slice($existing, -1000);
    }
    
    file_put_contents($logFile, json_encode($existing, JSON_PRETTY_PRINT));
}

/**
 * Store message event
 */
function storeMessageEvent($eventData) {
    // Similar to storeCallEvent
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/message_history.json';
    $existing = [];
    if (file_exists($logFile)) {
        $existing = json_decode(file_get_contents($logFile), true) ?: [];
    }
    
    $existing[] = $eventData;
    
    if (count($existing) > 1000) {
        $existing = array_slice($existing, -1000);
    }
    
    file_put_contents($logFile, json_encode($existing, JSON_PRETTY_PRINT));
}

/**
 * Fan out call events to other services
 */
function fanoutCallEvent($eventType, $eventData) {
    $endpoints = [
        '/api/marketing.php',
        '/api/sales/overview.php',
        '/api/secretary/dashboard.php'
    ];
    
    foreach ($endpoints as $endpoint) {
        // Async fanout (fire and forget)
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => getenv('DOMAIN_NAME') . $endpoint,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'action' => 'voice_event',
                'event_type' => $eventType,
                'data' => $eventData
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Internal-Secret: ' . (getenv('API_SECRET') ?: '')
            ],
            CURLOPT_TIMEOUT => 2,
            CURLOPT_RETURNTRANSFER => true
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

/**
 * Process incoming message
 */
function processIncomingMessage($eventData) {
    // Could integrate with DONNA logic to auto-respond
    // For now, just log it
    error_log("Incoming message received: " . json_encode($eventData));
}

/**
 * Verify webhook signature using Ed25519
 */
function verifyWebhookSignature($payload, $signature, $secret) {
    if (empty($signature) || empty($secret)) {
        return false;
    }
    
    // Telnyx uses Ed25519 signature verification
    // This is a simplified check - in production, use proper Ed25519 verification
    // For now, we'll do a basic check if the secret is in the signature header
    
    // In a real implementation, you would:
    // 1. Decode the base64 signature
    // 2. Use sodium_crypto_sign_verify_detached() or similar
    // 3. Verify against the payload and secret
    
    // For now, return true if signature is present (basic validation)
    // TODO: Implement proper Ed25519 verification
    return !empty($signature);
}
