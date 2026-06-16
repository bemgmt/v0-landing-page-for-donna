<?php
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/lib/response-cache.php';
$auth = donna_cors_and_auth();

respond_with_cache('health', function() {
  return [
    'ok' => true,
    'service' => 'donna-api',
    'version' => getenv('APP_VERSION') ?: 'v1',
    'time' => time(),
  ];
}, 60);
