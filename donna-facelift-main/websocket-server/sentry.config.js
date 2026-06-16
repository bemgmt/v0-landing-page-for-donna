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

