<?php
/**
 * Personality Configuration API
 * Handles personality configuration storage and retrieval
 */

require_once __DIR__ . '/../../bootstrap_env.php';
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../../lib/PersonalityConfigManager.php';
require_once __DIR__ . '/../../lib/ApiResponder.php';

// CORS and authentication
$auth = donna_cors_and_auth();

// Only allow POST and GET requests
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $userId = $auth['user_id'] ?? null;
    $clerkId = $auth['claims']['sub'] ?? $userId;
    
    if (!$userId) {
        ApiResponder::jsonUnauthorized('User not authenticated');
    }
    
    $personalityManager = new PersonalityConfigManager();
    
    // GET: Get personality configuration
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'current';
        
        switch ($action) {
            case 'current':
                $config = $personalityManager->getPersonalityConfig($userId, $clerkId);
                ApiResponder::jsonSuccess([
                    'personality' => $config,
                    'has_personality' => $config !== null
                ]);
                break;
                
            case 'presets':
                $presets = PersonalityConfigManager::getPresetPersonalities();
                ApiResponder::jsonSuccess([
                    'presets' => $presets
                ]);
                break;
                
            case 'for_donna':
                $personality = $personalityManager->getPersonalityForDONNA($userId, $clerkId);
                ApiResponder::jsonSuccess([
                    'personality' => $personality
                ]);
                break;
                
            default:
                ApiResponder::jsonBadRequest('Invalid action');
        }
    }
    
    // POST: Set personality configuration
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            ApiResponder::jsonBadRequest('Invalid JSON input');
        }
        
        $type = $input['type'] ?? null;
        
        if (!$type) {
            ApiResponder::jsonBadRequest('Type is required (preset, upload, or text)');
        }
        
        switch ($type) {
            case 'preset':
                $presetName = $input['preset_name'] ?? null;
                if (!$presetName) {
                    ApiResponder::jsonBadRequest('preset_name is required');
                }
                
                $result = $personalityManager->setPresetPersonality($userId, $presetName, $clerkId);
                
                if ($result) {
                    ApiResponder::jsonSuccess([
                        'message' => 'Personality configured successfully',
                        'personality' => $result
                    ]);
                } else {
                    ApiResponder::jsonServerError('Failed to configure personality');
                }
                break;
                
            case 'upload':
                $conversationData = $input['conversation_data'] ?? null;
                if (!$conversationData) {
                    ApiResponder::jsonBadRequest('conversation_data is required');
                }
                
                $result = $personalityManager->setPersonalityFromUpload($userId, $conversationData, $clerkId);
                
                if ($result) {
                    ApiResponder::jsonSuccess([
                        'message' => 'Personality configured from uploaded conversations',
                        'personality' => $result
                    ]);
                } else {
                    ApiResponder::jsonServerError('Failed to configure personality from upload');
                }
                break;
                
            case 'text':
                $text = $input['text'] ?? null;
                if (!$text) {
                    ApiResponder::jsonBadRequest('text is required');
                }
                
                $result = $personalityManager->setPersonalityFromText($userId, $text, $clerkId);
                
                if ($result) {
                    ApiResponder::jsonSuccess([
                        'message' => 'Personality configured from text',
                        'personality' => $result
                    ]);
                } else {
                    ApiResponder::jsonServerError('Failed to configure personality from text');
                }
                break;
                
            default:
                ApiResponder::jsonBadRequest('Invalid type. Use preset, upload, or text');
        }
    }
    
    else {
        ApiResponder::jsonMethodNotAllowed('Only GET and POST methods are allowed');
    }
    
} catch (Exception $e) {
    if (getenv('SENTRY_DSN')) {
        try {
            \Sentry\captureException($e);
        } catch (\Throwable $t) {}
    }
    
    ApiResponder::jsonServerError('An error occurred: ' . $e->getMessage());
}

