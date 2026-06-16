<?php
// Test version of marketing.php to isolate the 500 error
require_once __DIR__ . '/_auth.php';
$auth = donna_cors_and_auth();

try {
    echo json_encode(['step' => 1, 'message' => 'Headers set successfully']);
    
    // Test .env loading
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', DIRECTORY_SEPARATOR);
    $envDir = $docRoot ? dirname($docRoot) : dirname(__DIR__, 2);
    $envPath = $envDir . DIRECTORY_SEPARATOR . '.env';
    
    echo json_encode(['step' => 2, 'env_path' => $envPath, 'readable' => is_readable($envPath)]);
    
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
    
    echo json_encode(['step' => 3, 'marketing_api_base' => getenv('MARKETING_API_BASE')]);
    
    $proxyBase = getenv('MARKETING_API_BASE');
    if (!$proxyBase) {
        echo json_encode(['step' => 4, 'error' => 'MARKETING_API_BASE not found']);
        exit;
    }
    
    echo json_encode(['step' => 5, 'proxy_base' => $proxyBase, 'curl_available' => function_exists('curl_init')]);

    // Test the actual proxy request
    try {
        $action = $_GET['action'] ?? 'inbox';
        $limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
        $target = rtrim($proxyBase, '/') . "/api/marketing.php?action=" . urlencode($action) . "&limit=" . $limit;

        echo json_encode(['step' => 6, 'target_url' => $target]);

        // Try the proxy request
        if (function_exists('curl_init')) {
            echo json_encode(['step' => 6.1, 'message' => 'Starting cURL request']);

            $ch = curl_init($target);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
            ]);

            echo json_encode(['step' => 6.2, 'message' => 'cURL options set']);

            $proxyBody = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            echo json_encode([
                'step' => 7,
                'http_code' => $httpCode,
                'curl_error' => $curlError,
                'body_length' => strlen($proxyBody ?: ''),
                'body_preview' => substr($proxyBody ?: '', 0, 200)
            ]);
        }
    } catch (Exception $e2) {
        echo json_encode(['proxy_error' => $e2->getMessage(), 'line' => $e2->getLine()]);
    } catch (Error $e2) {
        echo json_encode(['proxy_fatal_error' => $e2->getMessage(), 'line' => $e2->getLine()]);
    }

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'line' => $e->getLine()]);
} catch (Error $e) {
    echo json_encode(['fatal_error' => $e->getMessage(), 'line' => $e->getLine()]);
}
?>
