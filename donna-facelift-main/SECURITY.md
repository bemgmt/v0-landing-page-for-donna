# Security Policy

## Overview

DONNA Interactive implements multiple layers of security for voice AI applications with real-time communication capabilities.

## Authentication & Authorization

### JWT/Clerk Authentication
- **Development**: Set `AUTH_DISABLE_CLERK=true` with `JWT_SECRET=dev` for local testing
- **Production**: Enable Clerk authentication with proper JWT validation
- **Token Endpoint**: `/api/realtime/token` requires valid authentication
- **Token TTL**: 5 minutes (production), 10 minutes (development)

### Authentication Configuration
```bash
# Development
AUTH_DISABLE_CLERK=true
JWT_SECRET=dev
NEXT_PUBLIC_DEV_JWT=dev.header.payload

# Production  
AUTH_DISABLE_CLERK=false
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
JWT_SECRET=your_strong_jwt_secret_32_chars_min
```

### Dev-only Clerk bypass (development)
To simplify local development when Clerk is not configured, the server skips Clerk if `AUTH_DISABLE_CLERK=true` or Clerk keys are not set. In that mode:
- Set `JWT_SECRET` (e.g., `dev`).
- For browser-triggered token requests, set `NEXT_PUBLIC_DEV_JWT` to any 3‑part token (e.g., `dev.header.payload`). The realtime client automatically sends `Authorization: Bearer <token>` to `/api/realtime/token`.

Caution: Do not enable this bypass in production; use Clerk or proper JWT issuance. See `docs/AUDIT_EXECUTIVE_SUMMARY.md` for a high-level overview.

## CORS & Origin Security

### Origin Allowlist Policy (FINALIZED)
- **Required**: `ALLOWED_ORIGINS` environment variable
- **Format**: Comma-separated list of allowed origins
- **Environment-Specific Configurations**:
  ```bash
  # Development
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
  
  # Staging/Preview
  ALLOWED_ORIGINS=https://staging.donna-interactive.com,https://donna-interactive-*.vercel.app
  
  # Production (LOCKED - No wildcards, no dev URLs)
  ALLOWED_ORIGINS=https://donna-interactive.com,https://www.donna-interactive.com
  ```

**Important**: Production origins are locked and must only include official production domains. No localhost, no wildcards, no preview URLs allowed in production.

### CORS Enforcement
- **Middleware**: Next.js middleware enforces CORS for API routes
- **PHP Backend**: CORSHelper class validates origins
- **WebSocket**: Origin validation in WebSocket upgrade requests
- **Failure Response**: 403 Forbidden for disallowed origins

## API Security

### Rate Limiting
- **Default Limits**: 100 requests/minute per IP for most endpoints
- **Health Endpoint**: 100 requests/minute (monitoring-friendly)
- **Token Endpoint**: 10 requests/minute (stricter for security)
- **Configuration**: Adjustable via environment variables

### Input Validation
- **All Inputs**: Validated using `InputValidator` class
- **Path Components**: Directory traversal protection
- **Email/Phone**: Format validation with sanitization
- **File Uploads**: Type and size restrictions

### Response Security
- **Standardized Format**: Most Next API routes use a consistent response schema; remaining PHP endpoints are being aligned.
- **Error Handling**: No sensitive information in error responses
- **Security Headers**: Applied to all responses
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Cache-Control: no-cache, no-store, must-revalidate`

## WebSocket Security

### Connection Security
- **Authentication**: JWT token required for WebSocket connections
- **Origin Validation**: WebSocket upgrade requests validate origin
- **Rate Limiting**: Connection limits per IP address
- **Automatic Disconnect**: Authentication timeout closes with 4001; invalid token closes with 4003; invalid origins are blocked at upgrade.

### VAD (Voice Activity Detection)
- **Default**: Server VAD disabled for security
- **Configuration**: Enable via `ENABLE_SERVER_VAD=true`
- **Client Control**: UI can toggle VAD with proper permissions

## Remote PHP Fanout

### Server-to-Server Communication
```bash
# Enable remote PHP backend
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
```

### Browser-to-PHP Communication (Optional)
```bash
# Enable direct browser calls to PHP
NEXT_PUBLIC_API_BASE=https://bemdonna.com/donna
```

**Security Notes**:
- Server-to-server fanout bypasses CORS (internal communication)
- Browser-to-PHP requires CORS configuration on PHP server
- Use HTTPS in production for all remote communications

## Environment Security

### Required Environment Variables
```bash
# Core Security
OPENAI_API_KEY=sk-...           # Required
ALLOWED_ORIGINS=https://...     # Required  
JWT_SECRET=minimum_32_chars     # Required for production

# Optional Security Enhancements
ENABLE_WS_PROXY=true           # WebSocket proxy security
MAX_CONNECTIONS_PER_IP=3       # Connection limits
RATE_LIMIT_WINDOW_MS=60000     # Rate limit window
```

### Development vs Production
- **Development**: More permissive settings for testing
- **Staging**: Production-like security with test credentials
- **Production**: Full security enforcement with monitoring

## Security Testing

### Automated Security Checks
```bash
# Security smoke (CORS + unauthorized path)
npm run test:security:smoke

# WS2 protocol tests
npm run test:ws2:all
```

### Manual Security Verification
```bash
# Test CORS blocking
curl -H "Origin: https://evil-site.com" http://localhost:3000/api/health

# Test auth requirement
curl -X POST http://localhost:3000/api/realtime/token

# Test rate limits
for i in {1..15}; do curl http://localhost:3000/api/health; done
```

## Incident Response

### Security Event Monitoring
- **Trace IDs**: All responses include correlation IDs
- **Security Logging**: Suspicious activities logged with sanitized data
- **Rate Limit Violations**: Logged with IP masking

### Emergency Procedures
1. **Suspected Breach**: Rotate `JWT_SECRET` and `OPENAI_API_KEY`
2. **DDoS Attack**: Reduce rate limits via environment variables
3. **Origin Compromise**: Update `ALLOWED_ORIGINS` allowlist
4. **Token Abuse**: Reduce token TTL and audit usage

## Vulnerability Reporting

### Responsible Disclosure
- **Contact**: [Security contact information]
- **Response Time**: 48 hours for initial response
- **Scope**: All components including voice AI, WebSocket, and PHP backend

### Security Updates
- **Dependency Audits**: Automated via `npm audit` in CI
- **Security Headers**: Validated in every deployment
- **CORS Configuration**: Tested in CI pipeline

## Compliance Notes

### Data Protection
- **PII Handling**: Minimal collection with automatic scrubbing
- **Audio Data**: Temporary storage with automatic cleanup
- **Conversation Logs**: Configurable retention periods
- **Memory Management**: Automatic cleanup of sensitive data

### Audit Trail
- **Request Tracing**: All API calls include trace IDs
- **Security Events**: Logged with sanitized information
- **Access Patterns**: Monitored for anomalies
- **Configuration Changes**: Tracked and logged

## Update History
- 2025-09-10 (WS1 Checkpoint 3):
  - **FINALIZED** production origin allowlist: `https://donna-interactive.com,https://www.donna-interactive.com`
  - Added environment-specific origin configurations (dev/staging/production)
  - Added CI negative-path tests for unauthorized (401) and bad origin (403) token requests
  - Created comprehensive environment configuration guide in `ENVIRONMENT_CONFIG.md`
  - Clarified token TTL (5 min prod, 10 min dev)
  - Updated WebSocket disconnect codes (4001/4003) and origin handling at upgrade
  - Replaced doc references to non-existent test scripts with `npm run test:security:smoke` and `npm run test:ws2:all`
  - Added dev-only Clerk bypass note and link to audit executive summary
