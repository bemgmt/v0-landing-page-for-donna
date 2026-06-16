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

require_once __DIR__ . '/../mcp/MCPServer.php';
require_once __DIR__ . '/../mcp/MCPTool.php';
require_once __DIR__ . '/../mcp/tools/EmailTool.php';
require_once __DIR__ . '/../mcp/tools/InboxTool.php';
require_once __DIR__ . '/../mcp/tools/EmailReplyTool.php';

try {
    // Initialize MCP Server
    $mcpServer = new MCPServer([
        'session_timeout' => 3600,
        'max_context_size' => 10000,
        'enable_persistence' => true,
        'storage_path' => __DIR__ . '/../mcp/storage'
    ]);
    
    // Register tools
    $mcpServer->registerTool('email', new EmailTool());
    $mcpServer->registerTool('contact', new ContactTool());
    $mcpServer->registerTool('inbox', new InboxTool());
    $mcpServer->registerTool('email_reply', new EmailReplyTool());
    
    // Get request data
    $input = file_get_contents('php://input');
    $request = json_decode($input, true);
    
    // Handle GET requests
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'info';
        
        switch ($action) {
            case 'info':
                echo json_encode([
                    'success' => true,
                    'message' => 'DONNA MCP Server is running',
                    'version' => '1.0.0',
                    'capabilities' => [
                        'tools' => $mcpServer->getTools(),
                        'sessions' => true,
                        'context_management' => true,
                        'workflows' => false, // Coming in Phase 3
                        'persistence' => true
                    ],
                    'endpoints' => [
                        'POST /api/mcp.php' => 'Execute MCP requests',
                        'GET /api/mcp.php?action=tools' => 'List available tools',
                        'GET /api/mcp.php?action=info' => 'Get server information'
                    ]
                ]);
                break;
                
            case 'tools':
                $result = $mcpServer->processRequest(['type' => 'tool_list']);
                echo json_encode($result);
                break;
                
            case 'tool_info':
                if (!isset($_GET['tool'])) {
                    throw new Exception('Tool name required');
                }
                $result = $mcpServer->processRequest([
                    'type' => 'tool_info',
                    'tool_name' => $_GET['tool']
                ]);
                echo json_encode($result);
                break;
                
            default:
                throw new Exception('Unknown action: ' . $action);
        }
        exit();
    }
    
    // Handle POST requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$request) {
            throw new Exception('Invalid JSON data');
        }
        
        // Process MCP request
        $result = $mcpServer->processRequest($request);
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
        'message' => 'MCP Server error occurred',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
