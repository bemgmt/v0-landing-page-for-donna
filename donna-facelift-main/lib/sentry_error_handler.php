<?php

namespace DONNA;

use Sentry\State\Scope;

class SentryErrorHandler {
    public static function handleError($severity, $message, $file, $line) {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        
        $error = new \ErrorException($message, 0, $severity, $file, $line);
        
        \Sentry\withScope(function (Scope $scope) use ($error, $severity) {
            $scope->setTag('error_type', 'php_error');
            $scope->setLevel(self::getSentryLevel($severity));
            $scope->setContext('php_error', [
                'severity' => $severity,
                'file' => $error->getFile(),
                'line' => $error->getLine()
            ]);
            \Sentry\captureException($error);
        });
        
        return true;
    }
    
    public static function handleException($exception) {
        \Sentry\withScope(function (Scope $scope) use ($exception) {
            $scope->setTag('error_type', 'exception');
            $scope->setLevel('error');
            $scope->setContext('exception', [
                'class' => get_class($exception),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ]);
            \Sentry\captureException($exception);
        });
    }
    
    public static function handleShutdown() {
        $error = error_get_last();
        if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
            $exception = new \ErrorException(
                $error['message'],
                0,
                $error['type'],
                $error['file'],
                $error['line']
            );
            
            \Sentry\withScope(function (Scope $scope) use ($exception) {
                $scope->setTag('error_type', 'fatal_error');
                $scope->setLevel('fatal');
                \Sentry\captureException($exception);
            });
        }
    }
    
    private static function getSentryLevel($severity) {
        switch ($severity) {
            case E_ERROR:
            case E_CORE_ERROR:
            case E_COMPILE_ERROR:
            case E_PARSE:
                return 'fatal';
            case E_USER_ERROR:
            case E_RECOVERABLE_ERROR:
                return 'error';
            case E_WARNING:
            case E_USER_WARNING:
                return 'warning';
            case E_NOTICE:
            case E_USER_NOTICE:
                return 'info';
            default:
                return 'error';
        }
    }
}

// Initialize Sentry client if DSN is configured (safe no-op otherwise)
if (getenv('SENTRY_DSN')) {
    // Try to ensure the SDK is available
    if (!function_exists('Sentry\\init')) {
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (is_file($autoload)) {
            require_once $autoload;
        }
    }
    if (function_exists('Sentry\\init')) {
        try {
            \Sentry\init([
                'dsn' => getenv('SENTRY_DSN'),
                'environment' => getenv('APP_ENV') ?: 'production',
                'traces_sample_rate' => (float)(getenv('SENTRY_TRACES_SAMPLE_RATE') ?: 0),
            ]);
        } catch (\Throwable $t) {
            // ignore SDK init errors
        }
    }
}

// Register error handlers
set_error_handler([\DONNA\SentryErrorHandler::class, 'handleError']);
set_exception_handler([\DONNA\SentryErrorHandler::class, 'handleException']);
register_shutdown_function([\DONNA\SentryErrorHandler::class, 'handleShutdown']);
