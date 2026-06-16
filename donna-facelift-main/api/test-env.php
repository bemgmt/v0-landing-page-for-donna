<?php
require_once __DIR__ . '/_auth.php';
$auth = donna_cors_and_auth();
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
$envPath = dirname($_SERVER['DOCUMENT_ROOT']) . '/.env';
echo "Looking for .env at: " . $envPath . "\n";
echo "File exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "\n";
echo "File readable: " . (is_readable($envPath) ? 'YES' : 'NO') . "\n";
if (is_readable($envPath)) {
    $content = file_get_contents($envPath);
    echo "MARKETING_API_BASE found: " . (strpos($content, 'MARKETING_API_BASE') !== false ? 'YES' : 'NO') . "\n";
}
?>