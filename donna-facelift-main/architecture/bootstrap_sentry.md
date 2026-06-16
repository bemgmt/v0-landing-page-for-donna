<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Sentry\State\Scope;

// Initialize Sentry
\Sentry\init([
    'dsn' => getenv('SENTRY_DSN'),
    'environment' => getenv('ENVIRONMENT') ?: 'development',
    'release' => getenv('APP_VERSION') ?: '1.0.0',
    'sample_rate' => getenv('ENVIRONMENT') === 'production' ? 0.1 : 1.0,
    'traces_sample_rate' => getenv('ENVIRONMENT') === 'production' ? 0.1 : 1.0,
    'send_default_pii' => false,
    'attach_stacktrace' => true,
    'context_lines' => 5,
    'max_breadcrumbs' => 50,
    'before_send' => function (\Sentry\Event $event, ?\Sentry\EventHint $hint): ?\Sentry\Event {
        // Custom filtering logic
        if ($event->getExceptions()) {
            foreach ($event->getExceptions() as $exception) {
                if (strpos($exception->getValue(), 'Undefined index') !== false) {
                    return null; // Ignore undefined index warnings
                }
            }
        }
        return $event;
    },
    'tags' => [
        'component' => 'backend',
        'platform' => 'php'
    ]
]);

// Set user context if available
if (isset($_SESSION['user_id'])) {
    \Sentry\configureScope(function (Scope $scope): void {
        $scope->setUser([
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'] ?? null,
            'username' => $_SESSION['username'] ?? null
        ]);
    });
}

// Add request context
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setTag('request_method', $_SERVER['REQUEST_METHOD'] ?? 'unknown');
    $scope->setTag('request_uri', $_SERVER['REQUEST_URI'] ?? 'unknown');
    $scope->setContext('request', [
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
});
