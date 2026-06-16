# Environment Configuration Guide

## ALLOWED_ORIGINS Configuration

### Development Environment
```env
# Local development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# Additional for testing
# Add any ngrok or local tunnel URLs during development
# Example: ALLOWED_ORIGINS=http://localhost:3000,https://abc123.ngrok.io
```

### Preview/Staging Environment
```env
# Preview deployments (Vercel preview URLs)
ALLOWED_ORIGINS=https://donna-interactive-*.vercel.app,https://donna-interactive-preview.vercel.app

# Staging domain (if applicable)
# ALLOWED_ORIGINS=https://staging.donna-interactive.com,https://donna-interactive-*.vercel.app
```

### Production Environment
```env
# Production domains ONLY - LOCKED LIST
ALLOWED_ORIGINS=https://donna-interactive.com,https://www.donna-interactive.com

# Alternative production setup with custom domain
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com
```

## Complete Environment Variables by Environment

### Development (.env.development)
```env
NODE_ENV=development
NEXT_PUBLIC_API_BASE=http://localhost/donna
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001/realtime

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
JWT_SECRET=dev-jwt-secret-change-in-production
PRODUCTION_DOMAIN=localhost

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs
ELEVENLABS_API_KEY=...
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt

# Features
ENABLE_WS_PROXY=false
ENABLE_RESPONSE_CACHE=true
ENABLE_PII_SCRUBBING=true
ENABLE_RECONNECT=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
MAX_CONNECTIONS_PER_IP=3

# Token TTL
TOKEN_TTL_SECONDS=600
```

### Staging (.env.staging)
```env
NODE_ENV=staging
NEXT_PUBLIC_API_BASE=https://staging.donna-interactive.com/api
NEXT_PUBLIC_WEBSOCKET_URL=wss://staging-ws.donna-interactive.com/realtime

# Security
ALLOWED_ORIGINS=https://staging.donna-interactive.com,https://donna-interactive-*.vercel.app
JWT_SECRET=${STAGING_JWT_SECRET}
PRODUCTION_DOMAIN=staging.donna-interactive.com

# OpenAI
OPENAI_API_KEY=${STAGING_OPENAI_API_KEY}
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs
ELEVENLABS_API_KEY=${STAGING_ELEVENLABS_API_KEY}
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt

# Features
ENABLE_WS_PROXY=false
ENABLE_RESPONSE_CACHE=true
ENABLE_PII_SCRUBBING=true
ENABLE_RECONNECT=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MAX_CONNECTIONS_PER_IP=5

# Token TTL
TOKEN_TTL_SECONDS=300
```

### Production (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE=https://donna-interactive.com/api
NEXT_PUBLIC_WEBSOCKET_URL=wss://ws.donna-interactive.com/realtime

# Security - LOCKED LIST
ALLOWED_ORIGINS=https://donna-interactive.com,https://www.donna-interactive.com
JWT_SECRET=${PROD_JWT_SECRET}
PRODUCTION_DOMAIN=donna-interactive.com

# OpenAI
OPENAI_API_KEY=${PROD_OPENAI_API_KEY}
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01

# ElevenLabs
ELEVENLABS_API_KEY=${PROD_ELEVENLABS_API_KEY}
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt

# Features
ENABLE_WS_PROXY=false
ENABLE_RESPONSE_CACHE=true
ENABLE_PII_SCRUBBING=true
ENABLE_RECONNECT=true

# Rate Limiting (Production)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
MAX_CONNECTIONS_PER_IP=3

# Token TTL (Production - SHORT)
TOKEN_TTL_SECONDS=300

# Optional monitoring
# SENTRY_DSN=${PROD_SENTRY_DSN}
# SENTRY_ENVIRONMENT=production
```

## Security Checklist for ALLOWED_ORIGINS

### Before Deployment
- [ ] Remove all localhost entries from staging/production
- [ ] Remove all wildcard entries from production
- [ ] Verify each domain in the list is owned by your organization
- [ ] Ensure HTTPS only for production origins
- [ ] Test CORS rejection with unauthorized origins

### Testing Origins
```bash
# Test allowed origin (should return 200)
curl -H "Origin: https://donna-interactive.com" \
     -I https://donna-interactive.com/api/health

# Test disallowed origin (should return 403)
curl -H "Origin: https://malicious.com" \
     -I https://donna-interactive.com/api/health
```

## Migration Path

### Phase 1: Development (Current)
- Wide allowlist for local development
- Includes localhost and common ports

### Phase 2: Staging
- Restrict to staging domain and preview URLs
- Remove localhost entries
- Test with production-like restrictions

### Phase 3: Production (LOCKED)
- **FINAL LIST**: `https://donna-interactive.com,https://www.donna-interactive.com`
- No wildcards
- No development URLs
- No preview URLs

## Environment Variable Validation

The system validates required environment variables at startup:
- Next.js: `lib/env-validation.ts`
- PHP: `bootstrap_env.php`
- WebSocket: `websocket-server/server.js`

Missing required variables will cause the application to fail fast with clear error messages.

## Secrets Management

### Required Secrets by Environment

#### Development
- Can use placeholder values for testing
- Store in `.env.local` (git-ignored)

#### Staging
- Use environment-specific secrets
- Store in CI/CD platform (GitHub Secrets, Vercel Environment Variables)
- Rotate monthly

#### Production
- Use unique production secrets
- Store in secure secret management system
- Rotate on schedule:
  - JWT_SECRET: Every 90 days
  - API Keys: Every 180 days
  - Database credentials: Every 90 days

### Secret Rotation Process
1. Generate new secret
2. Update in secret management system
3. Deploy with new secret
4. Monitor for issues
5. Remove old secret after verification

## Verification Commands

```bash
# Verify environment configuration
node -e "require('./lib/env-validation').validateEnvironment()"

# Check PHP environment
php api/test-env.php

# Test CORS with specific origin
curl -H "Origin: $TEST_ORIGIN" -I https://your-domain.com/api/health
```

---
*Last updated: 2025-09-10*
*Owner: CLAUDE (WS1)*