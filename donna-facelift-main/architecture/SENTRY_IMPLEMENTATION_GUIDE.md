# Sentry Integration Implementation Guide

## Quick Start

This guide will walk you through implementing Sentry error monitoring across the entire DONNA platform in 4 phases.

## Prerequisites

1. **Sentry Account**: Sign up at [sentry.io](https://sentry.io)
2. **Create Project**: Create a new project for DONNA platform
3. **Get DSN**: Copy your project DSN from Sentry dashboard

## Phase 1: Frontend Integration (Next.js)

### Step 1: Install Dependencies

```bash
npm install @sentry/nextjs @sentry/profiling-node
```

### Step 2: Configure Sentry

The configuration files are already created:
- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration

### Step 3: Update Next.js Configuration

Update your `next.config.mjs`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your existing config ...
};

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'donna-platform',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

### Step 4: Add Error Boundaries

Update your `app/layout.tsx`:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### Step 5: Update API Calls

Replace existing API calls with the Sentry-enabled version:

```typescript
// Before
const response = await fetch('/api/donna_logic.php', { ... })

// After
import { apiCall } from '@/lib/sentry-api'
const response = await apiCall('/api/donna_logic.php', { ... })
```

### Step 6: Add Error Tracking to Components

```typescript
import { useSentry } from '@/hooks/useSentry'

export default function MyComponent() {
  const { captureError, addBreadcrumb } = useSentry()
  
  const handleError = (error: Error) => {
    addBreadcrumb({
      message: 'User action failed',
      category: 'user',
      level: 'error'
    })
    captureError(error, { component: 'MyComponent' })
  }
  
  // ... rest of component
}
```

## Phase 2: Backend Integration (PHP)

### Step 1: Install Composer Dependencies

```bash
composer install
```

### Step 2: Update API Files

Add Sentry initialization to the top of each API file:

```php
<?php
require_once __DIR__ . '/../bootstrap_sentry.php';
require_once __DIR__ . '/../lib/sentry_error_handler.php';

// ... rest of your API code
```

### Step 3: Update Error Handling

Replace existing error handling:

```php
// Before
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => "API_ERROR"]);
}

// After
} catch (Exception $e) {
    \Sentry\withScope(function (\Sentry\State\Scope $scope) use ($e) {
        $scope->setTag('api_endpoint', 'donna_logic');
        $scope->setLevel('error');
        \Sentry\captureException($e);
    });
    
    error_log("Error: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => "API_ERROR"]);
}
```

## Phase 3: WebSocket Server Integration (Node.js)

### Step 1: Install Dependencies

```bash
cd websocket-server
npm install
```

### Step 2: Update Server File

Add Sentry initialization to the top of `websocket-server/server.js`:

```javascript
const Sentry = require('@sentry/node');
require('./sentry.config.js');

// ... rest of your server code
```

### Step 3: Add Error Tracking to WebSocket Handlers

```javascript
ws.on('message', async (message) => {
    const transaction = Sentry.startTransaction({
        name: 'WebSocket Message Processing',
        op: 'websocket.message'
    });

    try {
        // ... your message handling logic
    } catch (error) {
        Sentry.captureException(error, {
            tags: {
                websocket_error: true
            }
        });
    } finally {
        transaction.finish();
    }
});
```

## Phase 4: Environment Configuration

### Step 1: Set Environment Variables

Create your `.env` file based on `env.example`:

```bash
# Copy the example file
cp env.example .env

# Edit with your actual values
nano .env
```

### Step 2: Configure Sentry DSN

Update your `.env` file with your Sentry DSN:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/project-id
SENTRY_DSN=https://your-actual-dsn@sentry.io/project-id
```

### Step 3: Test the Integration

1. **Start your development servers**:
   ```bash
   # Frontend
   npm run dev
   
   # Backend (XAMPP/LAMP)
   # Start your web server
   
   # WebSocket Server
   cd websocket-server
   npm start
   ```

2. **Trigger an error** to test Sentry:
   - Navigate to a page that might have an error
   - Check your Sentry dashboard for incoming events

## Advanced Configuration

### Custom Error Filtering

You can customize which errors are sent to Sentry by modifying the `beforeSend` functions in the configuration files.

### Performance Monitoring

The integration includes automatic performance monitoring for:
- API calls
- WebSocket messages
- Frontend page loads
- Database queries

### User Context

Set user context for better error tracking:

```typescript
// Frontend
import { useSentry } from '@/hooks/useSentry'

const { setUser } = useSentry()
setUser({ id: 'user-123', email: 'user@example.com' })
```

```php
// Backend
\Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
    $scope->setUser([
        'id' => $user_id,
        'email' => $user_email
    ]);
});
```

## Deployment

### Production Deployment

1. **Set production environment variables**:
   ```bash
   NODE_ENV=production
   ENVIRONMENT=production
   ```

2. **Build and deploy**:
   ```bash
   npm run build
   # Deploy your application
   ```

3. **Upload source maps** (optional):
   ```bash
   npm run sentry:sourcemaps
   ```

### Release Tracking

Set up release tracking in your CI/CD pipeline:

```bash
# Create a new release
npm run sentry:release

# Upload source maps
npm run sentry:sourcemaps
```

## Monitoring and Alerting

### Set Up Alerts in Sentry

1. Go to your Sentry project settings
2. Navigate to "Alerts" → "Create Alert Rule"
3. Configure alerts for:
   - Error rate spikes
   - Performance degradation
   - Critical errors

### Dashboard Configuration

Create custom dashboards to monitor:
- Error rates by service
- API response times
- WebSocket connection stability
- User experience metrics

## Troubleshooting

### Common Issues

1. **DSN not working**: Verify your DSN is correct and the project exists
2. **No events in Sentry**: Check environment variables and network connectivity
3. **Too many events**: Adjust sample rates in configuration files
4. **Source maps not working**: Ensure source maps are uploaded correctly

### Debug Mode

Enable debug mode to see Sentry logs:

```bash
SENTRY_DEBUG=true
```

### Testing Error Tracking

Create a test endpoint to verify Sentry is working:

```php
// api/test-sentry.php
<?php
require_once __DIR__ . '/../bootstrap_sentry.php';

// Test error capture
\Sentry\captureMessage('Test message from DONNA backend', 'info');

// Test exception capture
try {
    throw new Exception('Test exception for Sentry');
} catch (Exception $e) {
    \Sentry\captureException($e);
}

echo json_encode(['success' => true, 'message' => 'Sentry test completed']);
?>
```

## Cost Optimization

### Sample Rates

Adjust sample rates based on your traffic:

```typescript
// High traffic: Lower sample rates
tracesSampleRate: 0.1,  // 10% of transactions
profilesSampleRate: 0.05, // 5% of profiles

// Low traffic: Higher sample rates
tracesSampleRate: 1.0,  // 100% of transactions
profilesSampleRate: 0.5, // 50% of profiles
```

### Error Filtering

Filter out non-critical errors to reduce noise:

```typescript
beforeSend(event, hint) {
  // Filter out ResizeObserver errors
  if (event.exception) {
    const error = hint.originalException;
    if (error instanceof Error && error.message.includes('ResizeObserver')) {
      return null;
    }
  }
  return event;
}
```

## Next Steps

1. **Monitor your Sentry dashboard** for the first few days
2. **Set up alerts** for critical errors
3. **Create custom dashboards** for your specific needs
4. **Integrate with your team's workflow** (Slack, email notifications)
5. **Regular review** of error trends and performance metrics

## Support

- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **Next.js Integration**: [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs)
- **PHP Integration**: [docs.sentry.io/platforms/php](https://docs.sentry.io/platforms/php)
- **Node.js Integration**: [docs.sentry.io/platforms/node](https://docs.sentry.io/platforms/node)

---

*This implementation guide provides everything you need to get Sentry error monitoring up and running across your entire DONNA platform.*
