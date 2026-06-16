<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../lib/DataAccessFactory.php';

use Google\Client;

try {
    $action = $_GET['action'] ?? 'auth_url';
    
    switch ($action) {
        case 'auth_url':
            echo json_encode(getAuthUrl());
            break;
            
        case 'callback':
            echo json_encode(handleCallback());
            break;
            
        case 'refresh':
            echo json_encode(refreshToken());
            break;
            
        case 'revoke':
            echo json_encode(revokeToken());
            break;
            
        default:
            throw new Exception('Unknown OAuth2 action: ' . $action);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'OAuth2 error occurred',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function getAuthUrl() {
    $client = createGoogleClient();
    
    $authUrl = $client->createAuthUrl();
    
    return [
        'success' => true,
        'auth_url' => $authUrl,
        'message' => 'Visit this URL to authorize DONNA to access Gmail'
    ];
}

function handleCallback() {
    if (!isset($_GET['code'])) {
        throw new Exception('Authorization code not provided');
    }

    $client = createGoogleClient();

    // Exchange authorization code for access token
    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);

    if (isset($token['error'])) {
        throw new Exception('OAuth2 error: ' . $token['error_description']);
    }

    // Store token in database instead of file
    storeToken($token);

    return [
        'success' => true,
        'message' => 'Gmail access authorized successfully',
        'token_expires' => date('Y-m-d H:i:s', time() + $token['expires_in']),
        'scopes' => $token['scope'] ?? 'gmail access'
    ];
}

function refreshToken() {
    $token = getStoredToken();

    if (!$token) {
        throw new Exception('No stored token found. Please re-authorize.');
    }

    if (!isset($token['refresh_token'])) {
        throw new Exception('No refresh token available. Please re-authorize.');
    }

    $client = createGoogleClient();
    $client->setAccessToken($token);

    if ($client->isAccessTokenExpired()) {
        $newToken = $client->fetchAccessTokenWithRefreshToken($token['refresh_token']);

        if (isset($newToken['error'])) {
            throw new Exception('Token refresh error: ' . $newToken['error_description']);
        }

        // Merge with existing token to preserve refresh_token
        $token = array_merge($token, $newToken);
        storeToken($token);

        return [
            'success' => true,
            'message' => 'Token refreshed successfully',
            'token_expires' => date('Y-m-d H:i:s', time() + $newToken['expires_in'])
        ];
    }

    return [
        'success' => true,
        'message' => 'Token is still valid',
        'token_expires' => date('Y-m-d H:i:s', $token['created'] + $token['expires_in'])
    ];
}

function revokeToken() {
    $token = getStoredToken();

    if (!$token) {
        return [
            'success' => true,
            'message' => 'No token to revoke'
        ];
    }

    $client = createGoogleClient();
    $client->setAccessToken($token);
    $client->revokeToken();

    // Delete stored token from database
    deleteStoredToken();

    return [
        'success' => true,
        'message' => 'Gmail access revoked successfully'
    ];
}

function createGoogleClient() {
    $client = new Client();

    // Load credentials
    $credentialsPath = $_ENV['GOOGLE_CREDENTIALS_PATH'] ?? __DIR__ . '/../credentials.json';

    if (!file_exists($credentialsPath)) {
        throw new Exception('Google credentials file not found. Please upload credentials.json');
    }

    $client->setAuthConfig($credentialsPath);
    $client->setScopes([
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
    ]);
    $client->setRedirectUri('https://donna-interactive-1.onrender.com/api/oauth2.php?action=callback');
    $client->setAccessType('offline');
    $client->setPrompt('consent');

    return $client;
}

// Database storage functions for OAuth tokens
function storeToken($token) {
    try {
        $dal = DataAccessFactory::create();

        // Store token as encrypted JSON in user memory
        // For now, use a system user ID (could be improved with proper user context)
        $systemUserId = 'system_oauth';
        $encryptedToken = base64_encode(json_encode($token));

        return $dal->setUserMemory($systemUserId, 'gmail_oauth_token', $encryptedToken, 'oauth',
                                  isset($token['expires_in']) ? date('Y-m-d H:i:s', time() + $token['expires_in']) : null);
    } catch (Exception $e) {
        // Fallback to file storage if database fails
        $tokenFile = __DIR__ . '/../mcp/storage/oauth2_token.json';
        if (!is_dir(dirname($tokenFile))) {
            mkdir(dirname($tokenFile), 0755, true);
        }
        return file_put_contents($tokenFile, json_encode($token, JSON_PRETTY_PRINT)) !== false;
    }
}

function getStoredToken() {
    try {
        $dal = DataAccessFactory::create();
        $systemUserId = 'system_oauth';

        $encryptedToken = $dal->getUserMemory($systemUserId, 'gmail_oauth_token');
        if ($encryptedToken) {
            return json_decode(base64_decode($encryptedToken), true);
        }
    } catch (Exception $e) {
        // Fallback to file storage
        $tokenFile = __DIR__ . '/../mcp/storage/oauth2_token.json';
        if (file_exists($tokenFile)) {
            return json_decode(file_get_contents($tokenFile), true);
        }
    }

    return null;
}

function deleteStoredToken() {
    try {
        $dal = DataAccessFactory::create();
        $systemUserId = 'system_oauth';

        $dal->deleteUserMemory($systemUserId, 'gmail_oauth_token');
    } catch (Exception $e) {
        // Fallback to file deletion
        $tokenFile = __DIR__ . '/../mcp/storage/oauth2_token.json';
        if (file_exists($tokenFile)) {
            unlink($tokenFile);
        }
    }
}
?>
