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

require_once __DIR__ . '/../logic/email_logic.php';

try {
    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Handle GET requests for testing
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'test') {
            $emailHandler = new EmailHandler();
            $result = $emailHandler->testConnection();
            echo json_encode($result);
            exit();
        }
        
        // Default GET response
        echo json_encode([
            'success' => true,
            'message' => 'DONNA Email API is ready',
            'endpoints' => [
                'POST /api/email.php' => 'Send email or parse email commands',
                'GET /api/email.php?action=test' => 'Test SMTP connection'
            ],
            'example_request' => [
                'action' => 'send',
                'to' => 'recipient@example.com',
                'subject' => 'Hello from DONNA',
                'body' => 'This is a test email from DONNA AI Assistant.'
            ]
        ]);
        exit();
    }
    
    // Handle POST requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$data) {
            throw new Exception('Invalid JSON data');
        }
        
        $result = handleEmailRequest($data);
        echo json_encode($result);
        exit();
    }
    
    // Method not allowed
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Email API error occurred'
    ]);
}
?>
