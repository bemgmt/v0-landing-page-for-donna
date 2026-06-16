# Sentry Integration Plan for DONNA Platform

## Overview

This document outlines a comprehensive Sentry integration strategy for the DONNA platform, covering all layers: Next.js frontend, PHP backend, Node.js WebSocket server, and external service integrations. The integration will provide real-time error monitoring, performance tracking, and user session replay across the entire application stack.

## Current Error Handling Analysis

### Existing Error Handling
- **Frontend**: Basic error boundary in `app/error.tsx`, console logging
- **Backend**: File-based error logging, basic try-catch blocks
- **WebSocket**: Console logging, basic error handling
- **No centralized error tracking or monitoring**

### Integration Requirements
- **Real-time error monitoring** across all services
- **Performance monitoring** for API calls and user interactions
- **User session replay** for debugging user experience issues
- **Release tracking** and deployment monitoring
- **Custom error boundaries** for different application layers
- **Integration with existing logging systems**

## Sentry Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SENTRY INTEGRATION LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND (Next.js)                                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Sentry SDK      │ │ Error Boundaries│ │ Performance     │   │
│  │ (React/Next.js) │ │ (Component)     │ │ Monitoring      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND (PHP)                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Sentry PHP SDK  │ │ Error Handler   │ │ Performance     │   │
│  │ (Composer)      │ │ (Middleware)    │ │ Tracking        │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  WEBSOCKET (Node.js)                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Sentry Node SDK │ │ Error Handler   │ │ Performance     │   │
│  │ (WebSocket)     │ │ (Middleware)    │ │ Monitoring      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ OpenAI API      │ │ ElevenLabs API  │ │ Gmail API       │   │
│  │ Error Tracking  │ │ Error Tracking  │ │ Error Tracking  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Frontend Integration (Next.js)

#### 1.1 Sentry SDK Installation

**Dependencies**:
```bash
npm install @sentry/nextjs @sentry/profiling-node
```

**Configuration** (`sentry.client.config.ts`):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release Tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Custom Tags
  initialScope: {
    tags: {
      component: 'frontend',
      platform: 'nextjs'
    }
  },
  
  // Error Filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error && error.message.includes('ResizeObserver')) {
        return null; // Ignore ResizeObserver errors
      }
    }
    return event;
  },
  
  // Custom Context
  beforeSendTransaction(event) {
    // Add custom transaction context
    if (event.transaction) {
      event.tags = {
        ...event.tags,
        transaction_type: 'api_call'
      };
    }
    return event;
  }
});
```

**Server Configuration** (`sentry.server.config.ts`):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  
  release: process.env.APP_VERSION,
  
  initialScope: {
    tags: {
      component: 'server',
      platform: 'nextjs'
    }
  }
});
```

#### 1.2 Enhanced Error Boundaries

**Global Error Boundary** (`components/ErrorBoundary.tsx`):
```typescript
'use client'

import * as Sentry from '@sentry/nextjs'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to Sentry with context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'global')
      scope.setContext('errorInfo', errorInfo)
      scope.setLevel('error')
      Sentry.captureException(error)
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h2 className="text-xl font-light mb-2">Something went wrong</h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-white text-black rounded"
              >
                Try again
              </button>
              <a href="/" className="px-4 py-2 bg-white/10 rounded">
                Back to home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Component-Specific Error Boundaries**:
```typescript
// Voice System Error Boundary
export class VoiceErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: any) {
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'voice')
      scope.setTag('component', 'VoiceProvider')
      scope.setContext('voiceState', {
        isRecording: false,
        isPlaying: false,
        connectionStatus: 'disconnected'
      })
      Sentry.captureException(error)
    })
  }
}

// API Error Boundary
export class APIErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: any) {
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'api')
      scope.setContext('apiContext', {
        endpoint: window.location.pathname,
        method: 'GET'
      })
      Sentry.captureException(error)
    })
  }
}
```

#### 1.3 Custom Hooks for Error Tracking

**Error Tracking Hook** (`hooks/useSentry.ts`):
```typescript
import { useCallback } from 'react'
import * as Sentry from '@sentry/nextjs'

export function useSentry() {
  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
      }
      scope.setLevel('error')
      Sentry.captureException(error)
    })
  }, [])

  const captureMessage = useCallback((message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level)
  }, [])

  const setUser = useCallback((user: { id?: string; email?: string; username?: string }) => {
    Sentry.setUser(user)
  }, [])

  const addBreadcrumb = useCallback((breadcrumb: {
    message: string
    category?: string
    level?: 'info' | 'warning' | 'error'
    data?: Record<string, any>
  }) => {
    Sentry.addBreadcrumb(breadcrumb)
  }, [])

  const startTransaction = useCallback((name: string, op: string) => {
    return Sentry.startTransaction({ name, op })
  }, [])

  return {
    captureError,
    captureMessage,
    setUser,
    addBreadcrumb,
    startTransaction
  }
}
```

**API Error Tracking** (`hooks/useAPIErrorTracking.ts`):
```typescript
import { useCallback } from 'react'
import { useSentry } from './useSentry'

export function useAPIErrorTracking() {
  const { captureError, addBreadcrumb } = useSentry()

  const trackAPIError = useCallback((
    error: Error,
    endpoint: string,
    method: string,
    requestData?: any,
    responseData?: any
  ) => {
    addBreadcrumb({
      message: `API Error: ${method} ${endpoint}`,
      category: 'api',
      level: 'error',
      data: { endpoint, method, requestData, responseData }
    })

    captureError(error, {
      api: {
        endpoint,
        method,
        requestData,
        responseData,
        timestamp: new Date().toISOString()
      }
    })
  }, [captureError, addBreadcrumb])

  return { trackAPIError }
}
```

#### 1.4 Performance Monitoring

**API Performance Tracking** (`lib/api.ts`):
```typescript
import * as Sentry from '@sentry/nextjs'

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name: `API Call: ${options.method || 'GET'} ${endpoint}`,
    op: 'http.client'
  })

  const span = transaction.startChild({
    op: 'http.client',
    description: `${options.method || 'GET'} ${endpoint}`
  })

  try {
    const response = await fetch(endpoint, options)
    
    span.setData('http.status_code', response.status)
    span.setData('http.method', options.method || 'GET')
    span.setData('http.url', endpoint)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    span.setStatus('ok')
    return data
  } catch (error) {
    span.setStatus('internal_error')
    Sentry.captureException(error as Error, {
      tags: {
        api_endpoint: endpoint,
        api_method: options.method || 'GET'
      }
    })
    throw error
  } finally {
    span.finish()
    transaction.finish()
  }
}
```

### Phase 2: Backend Integration (PHP)

#### 2.1 Sentry PHP SDK Installation

**Composer Installation**:
```bash
composer require sentry/sentry-laravel
```

**Configuration** (`config/sentry.php`):
```php
<?php

return [
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
        // Filter out non-critical errors
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
];
```

#### 2.2 Sentry Initialization

**Bootstrap Integration** (`bootstrap_sentry.php`):
```php
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
```

#### 2.3 Enhanced Error Handling

**Global Error Handler** (`lib/error_handler.php`):
```php
<?php

use Sentry\State\Scope;

class SentryErrorHandler {
    public static function handleError($severity, $message, $file, $line) {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        
        $error = new ErrorException($message, 0, $severity, $file, $line);
        
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
            $exception = new ErrorException(
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

// Register error handlers
set_error_handler([SentryErrorHandler::class, 'handleError']);
set_exception_handler([SentryErrorHandler::class, 'handleException']);
register_shutdown_function([SentryErrorHandler::class, 'handleShutdown']);
```

#### 2.4 API Error Tracking

**Enhanced API Error Handling** (`api/donna_logic.php`):
```php
<?php

require_once __DIR__ . '/../bootstrap_sentry.php';
require_once __DIR__ . '/../lib/error_handler.php';

// ... existing code ...

try {
    // ... existing API logic ...
    
} catch (Exception $e) {
    // Enhanced error logging with Sentry
    \Sentry\withScope(function (\Sentry\State\Scope $scope) use ($e, $input) {
        $scope->setTag('api_endpoint', 'donna_logic');
        $scope->setTag('error_type', 'api_error');
        $scope->setLevel('error');
        $scope->setContext('api_request', [
            'message' => $input['message'] ?? null,
            'user_profile' => $input['user_profile'] ?? null,
            'chat_id' => $input['chat_id'] ?? null,
            'user_id' => $input['user_id'] ?? null
        ]);
        $scope->setContext('api_response', [
            'success' => false,
            'error' => $e->getMessage()
        ]);
        \Sentry\captureException($e);
    });
    
    // Log to file (existing behavior)
    error_log("DONNA API Error: " . $e->getMessage());
    
    // Return user-friendly error
    echo json_encode([
        "success" => false,
        "reply" => "❌ I'm experiencing technical difficulties. Please try again in a moment.",
        "error" => "API_ERROR"
    ]);
}
```

### Phase 3: WebSocket Server Integration (Node.js)

#### 3.1 Sentry Node.js SDK Installation

**Dependencies**:
```bash
npm install @sentry/node @sentry/profiling-node
```

**Configuration** (`websocket-server/sentry.config.js`):
```javascript
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || '1.0.0',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  integrations: [
    nodeProfilingIntegration(),
  ],
  
  // Custom Tags
  initialScope: {
    tags: {
      component: 'websocket',
      platform: 'nodejs'
    }
  },
  
  // Error Filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('ECONNRESET')) {
        return null; // Ignore connection reset errors
      }
    }
    return event;
  }
});
```

#### 3.2 Enhanced WebSocket Error Handling

**Updated WebSocket Server** (`websocket-server/server.js`):
```javascript
const Sentry = require('@sentry/node');
require('./sentry.config.js');

// ... existing imports ...

// Enhanced WebSocket error handling
wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket connection');
    
    let openaiWs = null;
    const connectionId = Math.random().toString(36).substr(2, 9);
    
    // Set Sentry context for this connection
    Sentry.configureScope((scope) => {
        scope.setTag('connection_id', connectionId);
        scope.setTag('websocket_type', 'realtime');
    });

    ws.on('message', async (message) => {
        const transaction = Sentry.startTransaction({
            name: 'WebSocket Message Processing',
            op: 'websocket.message'
        });

        try {
            const data = JSON.parse(message.toString());
            
            // Add breadcrumb for message processing
            Sentry.addBreadcrumb({
                message: `Processing WebSocket message: ${data.type}`,
                category: 'websocket',
                level: 'info',
                data: { messageType: data.type, connectionId }
            });
            
            if (data.type === 'connect_realtime') {
                // Connect to OpenAI Realtime API with error tracking
                const connectSpan = transaction.startChild({
                    op: 'openai.connect',
                    description: 'Connect to OpenAI Realtime API'
                });
                
                try {
                    openaiWs = new WebSocket(wsUrl, { headers });
                    
                    openaiWs.on('open', () => {
                        connectSpan.setStatus('ok');
                        console.log('✅ Connected to OpenAI Realtime API');
                        
                        Sentry.addBreadcrumb({
                            message: 'Connected to OpenAI Realtime API',
                            category: 'openai',
                            level: 'info'
                        });
                    });
                    
                    openaiWs.on('error', (error) => {
                        connectSpan.setStatus('internal_error');
                        Sentry.captureException(error, {
                            tags: {
                                service: 'openai_realtime',
                                connection_id: connectionId
                            },
                            contexts: {
                                websocket: {
                                    connection_id: connectionId,
                                    message_type: data.type
                                }
                            }
                        });
                    });
                    
                } catch (error) {
                    connectSpan.setStatus('internal_error');
                    throw error;
                } finally {
                    connectSpan.finish();
                }
            }
            
            // ... rest of message handling logic ...
            
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    websocket_error: true,
                    connection_id: connectionId
                },
                contexts: {
                    websocket: {
                        connection_id: connectionId,
                        message: message.toString().substring(0, 1000) // Limit message size
                    }
                }
            });
            
            // Send error response to client
            ws.send(JSON.stringify({
                type: 'error',
                error: {
                    message: 'Message processing failed',
                    code: 'processing_error'
                }
            }));
        } finally {
            transaction.finish();
        }
    });

    ws.on('error', (error) => {
        Sentry.captureException(error, {
            tags: {
                websocket_error: true,
                connection_id: connectionId,
                error_type: 'connection_error'
            }
        });
    });

    ws.on('close', (code, reason) => {
        Sentry.addBreadcrumb({
            message: `WebSocket connection closed: ${code} - ${reason}`,
            category: 'websocket',
            level: 'info',
            data: { code, reason: reason.toString(), connectionId }
        });
        
        if (openaiWs) {
            openaiWs.close();
        }
    });
});
```

### Phase 4: External Service Integration

#### 4.1 OpenAI API Error Tracking

**Enhanced OpenAI Client** (`voice_system/openai_realtime_client.php`):
```php
<?php

class OpenAIRealtimeClient {
    // ... existing code ...
    
    public function makeRequest($url, $data, $method = 'POST') {
        $transaction = \Sentry\startTransaction([
            'name' => 'OpenAI API Request',
            'op' => 'http.client'
        ]);
        
        $span = $transaction->startChild([
            'op' => 'http.client',
            'description' => "{$method} {$url}"
        ]);
        
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $this->apiKey,
                    'Content-Type: application/json'
                ]
            ]);
            
            if ($method === 'POST' && $data) {
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            $span->setData('http.status_code', $httpCode);
            $span->setData('http.method', $method);
            $span->setData('http.url', $url);
            
            if ($error) {
                throw new Exception('cURL error: ' . $error);
            }
            
            if ($httpCode !== 200) {
                $errorData = json_decode($response, true);
                throw new Exception("OpenAI API error (HTTP {$httpCode}): " . ($errorData['error']['message'] ?? 'Unknown error'));
            }
            
            $span->setStatus('ok');
            return json_decode($response, true);
            
        } catch (Exception $e) {
            $span->setStatus('internal_error');
            
            \Sentry\withScope(function (\Sentry\State\Scope $scope) use ($e, $url, $method, $data) {
                $scope->setTag('service', 'openai');
                $scope->setTag('api_endpoint', $url);
                $scope->setLevel('error');
                $scope->setContext('openai_request', [
                    'url' => $url,
                    'method' => $method,
                    'data' => $data
                ]);
                \Sentry\captureException($e);
            });
            
            throw $e;
        } finally {
            $span->finish();
            $transaction->finish();
        }
    }
}
```

#### 4.2 ElevenLabs API Error Tracking

**Enhanced ElevenLabs Client** (`voice_system/elevenlabs_client.php`):
```php
<?php

class ElevenLabsClient {
    // ... existing code ...
    
    private function makeRequest($url, $data = null, $method = 'GET', $isBinary = false, $isMultipart = false) {
        $transaction = \Sentry\startTransaction([
            'name' => 'ElevenLabs API Request',
            'op' => 'http.client'
        ]);
        
        $span = $transaction->startChild([
            'op' => 'http.client',
            'description' => "{$method} {$url}"
        ]);
        
        try {
            $ch = curl_init();
            
            $headers = [
                'xi-api-key: ' . $this->apiKey,
            ];
            
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_HTTPHEADER => $headers
            ]);
            
            if ($method === 'POST') {
                curl_setopt($ch, CURLOPT_POST, true);
                
                if ($isMultipart) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
                } elseif ($data) {
                    $headers[] = 'Content-Type: application/json';
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                }
            }
            
            if ($isBinary) {
                curl_setopt($ch, CURLOPT_BINARYTRANSFER, true);
            }
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            $span->setData('http.status_code', $httpCode);
            $span->setData('http.method', $method);
            $span->setData('http.url', $url);
            
            if ($error) {
                throw new Exception('cURL error: ' . $error);
            }
            
            if ($isBinary && $httpCode === 200) {
                $span->setStatus('ok');
                return $response; // Return raw audio data
            }
            
            $decodedResponse = json_decode($response, true);
            
            if ($httpCode !== 200) {
                $errorMessage = $decodedResponse['detail'] ?? 'Unknown error';
                throw new Exception("ElevenLabs API error (HTTP {$httpCode}): {$errorMessage}");
            }
            
            $span->setStatus('ok');
            return $decodedResponse;
            
        } catch (Exception $e) {
            $span->setStatus('internal_error');
            
            \Sentry\withScope(function (\Sentry\State\Scope $scope) use ($e, $url, $method, $data) {
                $scope->setTag('service', 'elevenlabs');
                $scope->setTag('api_endpoint', $url);
                $scope->setLevel('error');
                $scope->setContext('elevenlabs_request', [
                    'url' => $url,
                    'method' => $method,
                    'data' => $data
                ]);
                \Sentry\captureException($e);
            });
            
            throw $e;
        } finally {
            $span->finish();
            $transaction->finish();
        }
    }
}
```

## Environment Configuration

### Environment Variables

**Frontend (.env.local)**:
```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

**Backend (.env)**:
```bash
# Sentry Configuration
SENTRY_DSN=https://your-dsn@sentry.io/project-id
APP_VERSION=1.0.0
ENVIRONMENT=production
```

**WebSocket Server (.env)**:
```bash
# Sentry Configuration
SENTRY_DSN=https://your-dsn@sentry.io/project-id
APP_VERSION=1.0.0
NODE_ENV=production
```

### Next.js Configuration

**Updated next.config.mjs**:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...
  
  // Sentry configuration
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'donna-platform',
  
  // Only run Sentry in production
  silent: !process.env.CI,
  
  // Upload source maps
  widenClientFileUpload: true,
  
  // Hide source maps
  hideSourceMaps: true,
  
  // Disable Sentry logger
  disableLogger: true,
});
```

## Deployment Integration

### 1. Release Tracking

**GitHub Actions Integration** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy with Sentry Release Tracking

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Sentry Release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: your-org
          SENTRY_PROJECT: donna-platform
        with:
          environment: production
          version: ${{ github.sha }}
          
      - name: Upload Source Maps
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: your-org
          SENTRY_PROJECT: donna-platform
        with:
          version: ${{ github.sha }}
          sourcemaps: .next/static/chunks/
          
      - name: Deploy to Production
        run: |
          # Your deployment commands here
          
      - name: Finalize Sentry Release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: your-org
          SENTRY_PROJECT: donna-platform
        with:
          version: ${{ github.sha }}
          finalize: true
```

### 2. Performance Monitoring

**Custom Performance Metrics**:
```typescript
// Frontend performance tracking
export function trackPerformance(operation: string, fn: () => Promise<any>) {
  return Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    async (span) => {
      try {
        const result = await fn();
        span.setStatus('ok');
        return result;
      } catch (error) {
        span.setStatus('internal_error');
        throw error;
      }
    }
  );
}

// Usage example
const salesData = await trackPerformance('fetch_sales_data', async () => {
  return await fetch('/api/sales/overview.php');
});
```

## Monitoring and Alerting

### 1. Sentry Dashboard Configuration

**Error Alerts**:
- Critical errors (fatal level)
- API errors with high frequency
- WebSocket connection failures
- External service timeouts

**Performance Alerts**:
- API response times > 5 seconds
- WebSocket message processing > 1 second
- Frontend page load times > 3 seconds

### 2. Custom Dashboards

**Key Metrics to Track**:
- Error rate by service (frontend, backend, websocket)
- API response times by endpoint
- WebSocket connection stability
- External service availability
- User session health

## Implementation Timeline

### Week 1: Frontend Integration
- Install Sentry SDK
- Configure error boundaries
- Implement custom hooks
- Set up performance monitoring

### Week 2: Backend Integration
- Install Sentry PHP SDK
- Configure error handlers
- Enhance API error tracking
- Set up performance monitoring

### Week 3: WebSocket Integration
- Install Sentry Node.js SDK
- Enhance WebSocket error handling
- Implement connection tracking
- Set up performance monitoring

### Week 4: External Services & Deployment
- Integrate external service error tracking
- Set up release tracking
- Configure monitoring and alerting
- Deploy and test

## Cost Estimation

### Sentry Pricing (Approximate)
- **Team Plan**: $26/month (up to 50K errors, 100K transactions)
- **Business Plan**: $80/month (up to 200K errors, 500K transactions)
- **Enterprise Plan**: Custom pricing

### Development Time
- **Frontend Integration**: 16-20 hours
- **Backend Integration**: 12-16 hours
- **WebSocket Integration**: 8-12 hours
- **External Services**: 8-12 hours
- **Testing & Deployment**: 8-12 hours

**Total**: 52-72 hours

## Benefits

### 1. Real-time Error Monitoring
- Immediate notification of critical errors
- Detailed error context and stack traces
- User impact assessment

### 2. Performance Insights
- API response time monitoring
- Frontend performance tracking
- WebSocket connection stability

### 3. User Experience Monitoring
- Session replay for debugging
- User journey tracking
- Error impact on user flows

### 4. Proactive Issue Resolution
- Early detection of issues
- Trend analysis and forecasting
- Release impact assessment

---

*This comprehensive Sentry integration plan will provide complete error monitoring, performance tracking, and user experience insights across the entire DONNA platform, enabling proactive issue resolution and improved system reliability.*

