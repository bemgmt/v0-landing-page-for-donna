<?php
/**
 * Call History API
 * Retrieves call history stored from webhooks
 */

require_once __DIR__ . '/_auth.php';
$auth = donna_cors_and_auth();
header('Content-Type: application/json');

require_once __DIR__ . '/../bootstrap_env.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $callId = $_GET['id'] ?? null;
    
    if ($method === 'GET') {
        if ($callId) {
            // Get specific call details
            $call = getCallById($callId);
            if ($call) {
                echo json_encode([
                    'success' => true,
                    'call' => $call
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Call not found'
                ]);
            }
        } else {
            // List calls with optional filters
            $filters = [
                'limit' => intval($_GET['limit'] ?? 50),
                'offset' => intval($_GET['offset'] ?? 0),
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
                'phone_number' => $_GET['phone_number'] ?? null
            ];
            
            $calls = getCallHistory($filters);
            
            echo json_encode([
                'success' => true,
                'calls' => $calls['calls'] ?? [],
                'total' => $calls['total'] ?? count($calls['calls'] ?? []),
                'limit' => $filters['limit'],
                'offset' => $filters['offset']
            ]);
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
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
 * Get call history with filters
 */
function getCallHistory($filters = []) {
    $logFile = __DIR__ . '/../logs/call_history.json';
    
    if (!file_exists($logFile)) {
        return ['calls' => [], 'total' => 0];
    }
    
    $allCalls = json_decode(file_get_contents($logFile), true) ?: [];
    
    // Apply filters
    $filtered = $allCalls;
    
    if (!empty($filters['date_from'])) {
        $dateFrom = strtotime($filters['date_from']);
        $filtered = array_filter($filtered, function($call) use ($dateFrom) {
            $callDate = strtotime($call['occurred_at'] ?? '1970-01-01');
            return $callDate >= $dateFrom;
        });
    }
    
    if (!empty($filters['date_to'])) {
        $dateTo = strtotime($filters['date_to']);
        $filtered = array_filter($filtered, function($call) use ($dateTo) {
            $callDate = strtotime($call['occurred_at'] ?? '9999-12-31');
            return $callDate <= $dateTo;
        });
    }
    
    if (!empty($filters['phone_number'])) {
        $phoneNumber = preg_replace('/[^\d+]/', '', $filters['phone_number']);
        $filtered = array_filter($filtered, function($call) use ($phoneNumber) {
            $from = preg_replace('/[^\d+]/', '', $call['from'] ?? '');
            $to = preg_replace('/[^\d+]/', '', $call['to'] ?? '');
            return strpos($from, $phoneNumber) !== false || strpos($to, $phoneNumber) !== false;
        });
    }
    
    // Sort by occurred_at descending (most recent first)
    usort($filtered, function($a, $b) {
        $timeA = strtotime($a['occurred_at'] ?? '1970-01-01');
        $timeB = strtotime($b['occurred_at'] ?? '1970-01-01');
        return $timeB <=> $timeA;
    });
    
    $total = count($filtered);
    
    // Apply pagination
    $offset = $filters['offset'] ?? 0;
    $limit = $filters['limit'] ?? 50;
    $filtered = array_slice($filtered, $offset, $limit);
    
    return [
        'calls' => array_values($filtered),
        'total' => $total
    ];
}

/**
 * Get specific call by ID
 */
function getCallById($callId) {
    $logFile = __DIR__ . '/../logs/call_history.json';
    
    if (!file_exists($logFile)) {
        return null;
    }
    
    $allCalls = json_decode(file_get_contents($logFile), true) ?: [];
    
    foreach ($allCalls as $call) {
        if (($call['call_id'] ?? '') === $callId) {
            return $call;
        }
    }
    
    return null;
}
