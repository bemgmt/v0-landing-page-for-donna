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
