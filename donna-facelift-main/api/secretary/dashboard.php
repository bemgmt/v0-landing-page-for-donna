<?php
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../lib/ApiResponder.php';
require_once __DIR__ . '/../lib/response-cache.php';
$auth = donna_cors_and_auth();
ApiResponder::initTraceId();

if (!$auth) {
    ApiResponder::jsonAuthError();
}

respond_with_cache('secretary_dashboard', function() {
    $data = [
        'in_queue' => 2,
        'tasks_today' => 14,
        'languages_supported' => ['en','es','zh']
    ];
    return ApiResponder::asArraySuccess($data);
}, 120);

