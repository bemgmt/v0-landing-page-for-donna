<?php
// Simplified Marketing Inbox API - Proxy only
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_rate_limit.php';
$auth = donna_cors_and_auth();
// Light rate limiting to protect proxy
donna_rate_limit('marketing_proxy', 30, 60);

// Load MARKETING_API_BASE from .env
$docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', DIRECTORY_SEPARATOR);
$envDir = dirname($docRoot);
$envPath = $envDir . '/.env';

if (is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $trim = trim($line);
        if ($trim === '' || $trim[0] === '#') continue;
        if (strpos($trim, '=') === false) continue;
        [$k, $v] = array_map('trim', explode('=', $trim, 2));
        if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
            $v = substr($v, 1, -1);
        }
        putenv("$k=$v");
        $_ENV[$k] = $v;
        $_SERVER[$k] = $v;
    }
}

$proxyBase = getenv('MARKETING_API_BASE');
if (!$proxyBase) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'MARKETING_API_BASE not configured']);
    exit;
}

$action = $_GET['action'] ?? 'inbox';
$limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
$target = rtrim($proxyBase, '/') . "/api/marketing.php?action=" . urlencode($action) . "&limit=" . $limit;

// Make proxy request
if (function_exists('curl_init')) {
    $ch = curl_init($target);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $proxyBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
} else {
    $ctx = stream_context_create(['http' => ['timeout' => 10, 'header' => "Accept: application/json\r\n"]]);
    $proxyBody = @file_get_contents($target, false, $ctx);
    $httpCode = $proxyBody !== false ? 200 : 500;
    $curlError = $proxyBody === false ? 'file_get_contents failed' : '';
}

if ($proxyBody === false || $httpCode >= 400) {
    http_response_code(502);
    echo json_encode([
        'success' => false, 
        'error' => 'Proxy request failed',
        'target' => $target,
        'http_code' => $httpCode,
        'curl_error' => $curlError
    ]);
    exit;
}

echo $proxyBody;
?>
