<?php
// Bootstrap environment variables from a .env file located one level above public_html
// This avoids storing secrets inside the web root. Safe for shared hosting like SiteGround.

// Try to locate the directory above public_html using DOCUMENT_ROOT when available
$docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', DIRECTORY_SEPARATOR);
if ($docRoot && is_dir($docRoot)) {
    // Example: /home/user/public_html -> dirname => /home/user
    $envDir = dirname($docRoot);
} else {
    // Fallback: base on this file's location. This file should live at public_html/donna/bootstrap_env.php
    // So going up 2 levels gets to /home/user
    $envDir = dirname(__DIR__, 2);
}

// For development, also check project root for .env.local or .env
// bootstrap_env.php is in project root, so __DIR__ is the project root
$projectRoot = __DIR__;
$envPaths = [
    $projectRoot . DIRECTORY_SEPARATOR . '.env.local',
    $projectRoot . DIRECTORY_SEPARATOR . '.env',
    $envDir . DIRECTORY_SEPARATOR . '.env',
];

$envPath = null;
foreach ($envPaths as $path) {
    if (is_readable($path)) {
        $envPath = $path;
        break;
    }
}

if ($envPath && is_readable($envPath)) {
    // Simple .env parser: KEY=VALUE per line, ignores comments and blank lines
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $trim = trim($line);
        if ($trim === '' || $trim[0] === '#') continue;
        if (strpos($trim, '=') === false) continue;
        [$k, $v] = array_map('trim', explode('=', $trim, 2));
        // strip surrounding quotes
        if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
            $v = substr($v, 1, -1);
        }
        // Populate all common env sources
        putenv("$k=$v");
        $_ENV[$k] = $v;
        $_SERVER[$k] = $v;
    }
}

// No output; this file is meant to be included at the top of API scripts before getenv()/$_ENV lookups

// Include environment validator after loading env vars
require_once __DIR__ . '/api/lib/env-validator.php';

// Include rate limiter for all API endpoints
require_once __DIR__ . '/api/lib/rate-limiter.php';

// Initialize PHP Sentry error handler (captures warnings/fatal errors)
// Safe guard: only load when DSN is set and file exists
$__sentryHandler = __DIR__ . '/lib/sentry_error_handler.php';
if (getenv('SENTRY_DSN') && is_file($__sentryHandler)) {
    require_once $__sentryHandler;
}
