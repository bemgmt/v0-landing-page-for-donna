<?php

// Simple flat-file IP-based rate limiter
// Usage: donna_rate_limit('bucket_name', 60, 60) // 60 requests per 60 seconds

function donna_rate_limit(string $bucket, int $limit, int $windowSec = 60): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $sanitized = preg_replace('/[^a-z0-9_.:-]/i', '_', $ip);
    $key = $bucket . '_' . $sanitized;
    $dir = __DIR__ . '/../data/rate';
    if (!is_dir($dir)) { @mkdir($dir, 0777, true); }
    $path = $dir . '/' . $key . '.json';

    $now = time();
    $data = ['start' => $now, 'count' => 0];
    if (is_file($path)) {
        $read = json_decode(@file_get_contents($path), true);
        if (is_array($read)) { $data = array_merge($data, $read); }
    }

    if ($now - intval($data['start'] ?? 0) >= $windowSec) {
        $data = ['start' => $now, 'count' => 0];
    }

    $data['count'] = intval($data['count'] ?? 0) + 1;
    @file_put_contents($path, json_encode($data));

    if ($data['count'] > $limit) {
        header('Retry-After: ' . max(1, $windowSec - ($now - intval($data['start'] ?? 0))));
        http_response_code(429);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Rate limit exceeded']);
        exit;
    }
}

?>

