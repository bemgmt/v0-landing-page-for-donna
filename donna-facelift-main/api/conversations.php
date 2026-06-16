<?php
/**
 * Conversations API - Manage chat sessions and conversations
 * Updated to use DataAccessInterface instead of direct file operations
 */

require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/lib/response-cache.php';
require_once __DIR__ . '/../lib/DataAccessFactory.php';

$auth = donna_cors_and_auth();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $dal = DataAccessFactory::create();

    switch ($method) {
        case 'GET':
            handleGetConversations($dal, $auth);
            break;

        case 'POST':
            handleCreateConversation($dal, $auth);
            break;

        case 'PUT':
            handleUpdateConversation($dal, $auth);
            break;

        case 'DELETE':
            handleDeleteConversation($dal, $auth);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed',
                'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE']
            ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function handleGetConversations($dal, $auth) {
    respond_with_cache('conversations_' . $auth['user_id'], function() use ($dal, $auth) {
        try {
            $conversations = $dal->getUserChatSessions($auth['user_id']);

            // Format conversations for API response
            $formattedConversations = array_map(function($conversation) use ($dal) {
                $messageCount = 0;
                $lastMessage = null;

                try {
                    $messages = $dal->getChatMessages($conversation['id'], 1);
                    $messageCount = $conversation['message_count'] ?? count($dal->getChatMessages($conversation['id']));
                    $lastMessage = !empty($messages) ? $messages[0] : null;
                } catch (Exception $e) {
                    // Continue with default values if message retrieval fails
                }

                return [
                    'id' => $conversation['id'],
                    'title' => $conversation['title'] ?? 'Untitled Conversation',
                    'created_at' => $conversation['created_at'],
                    'updated_at' => $conversation['updated_at'] ?? $conversation['created_at'],
                    'last_message_at' => $conversation['last_message_at'] ?? $conversation['created_at'],
                    'message_count' => $messageCount,
                    'status' => $conversation['status'] ?? 'active',
                    'last_message_preview' => $lastMessage ? substr($lastMessage['content'], 0, 100) . '...' : null,
                    'metadata' => $conversation['metadata'] ?? []
                ];
            }, $conversations);

            return [
                'success' => true,
                'data' => $formattedConversations,
                'count' => count($formattedConversations),
                'user_id' => $auth['user_id']
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to retrieve conversations',
                'message' => $e->getMessage()
            ];
        }
    }, 120);
}

function handleCreateConversation($dal, $auth) {
    invalidate_cache('conversations_' . $auth['user_id']);

    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $sessionData = [
            'title' => $input['title'] ?? 'New Conversation',
            'profile' => $input['profile'] ?? null,
            'metadata' => $input['metadata'] ?? []
        ];

        $conversation = $dal->createChatSession($auth['user_id'], $sessionData);

        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $conversation['id'],
                'title' => $conversation['title'],
                'created_at' => $conversation['created_at'],
                'status' => $conversation['status'] ?? 'active',
                'message_count' => 0
            ],
            'message' => 'Conversation created successfully'
        ]);

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create conversation',
            'message' => $e->getMessage()
        ]);
    }
}

function handleUpdateConversation($dal, $auth) {
    $input = json_decode(file_get_contents('php://input'), true);
    $conversationId = $input['id'] ?? null;

    if (!$conversationId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Conversation ID required'
        ]);
        return;
    }

    invalidate_cache('conversations_' . $auth['user_id']);

    try {
        // Verify conversation belongs to user
        $conversation = $dal->getChatSession($conversationId);
        if (!$conversation || $conversation['user_id'] !== $auth['user_id']) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Conversation not found'
            ]);
            return;
        }

        $updateData = [];
        if (isset($input['title'])) $updateData['title'] = $input['title'];
        if (isset($input['status'])) $updateData['status'] = $input['status'];
        if (isset($input['metadata'])) $updateData['metadata'] = $input['metadata'];

        $success = $dal->updateChatSession($conversationId, $updateData);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Conversation updated successfully'
            ]);
        } else {
            throw new Exception('Update operation failed');
        }

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update conversation',
            'message' => $e->getMessage()
        ]);
    }
}

function handleDeleteConversation($dal, $auth) {
    $input = json_decode(file_get_contents('php://input'), true);
    $conversationId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$conversationId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Conversation ID required'
        ]);
        return;
    }

    invalidate_cache('conversations_' . $auth['user_id']);

    try {
        // Verify conversation belongs to user
        $conversation = $dal->getChatSession($conversationId);
        if (!$conversation || $conversation['user_id'] !== $auth['user_id']) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Conversation not found'
            ]);
            return;
        }

        $success = $dal->deleteChatSession($conversationId);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Conversation deleted successfully'
            ]);
        } else {
            throw new Exception('Delete operation failed');
        }

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to delete conversation',
            'message' => $e->getMessage()
        ]);
    }
}
?>

