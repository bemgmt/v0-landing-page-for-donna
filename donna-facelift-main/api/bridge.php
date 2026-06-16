<?php
// api/bridge.php - Bridge between React frontend and PHP backend
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route handler
function handleRequest($method, $path, $input) {
    switch ($path) {
        case 'test':
            return handleTest($method, $input);
        case 'analytics':
            // Route to dedicated analytics.php file
            include __DIR__ . '/analytics.php';
            return;
        default:
            return ['error' => 'Invalid endpoint', 'path' => $path, 'available_endpoints' => ['test', 'analytics']];
    }
}

// Test handler for debugging
function handleTest($method, $input) {
    return [
        'success' => true,
        'message' => 'API Bridge is working!',
        'method' => $method,
        'input_received' => $input,
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'current_path' => __DIR__
        ]
    ];
}

// Execute the request
try {
    $result = handleRequest($method, $path, $input);
    if ($result) {
        echo json_encode($result);
    }
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
