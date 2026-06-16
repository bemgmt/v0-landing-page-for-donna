# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Quick Start
```bash
# Development setup
npm install
npm run dev                           # Next.js on :3000
php -S 127.0.0.1:8000 -t .           # Optional PHP dev server

# Critical tests before any PR
npm run test:ws2:all                 # WebSocket contract tests
npm run test:security:smoke          # Security validation
npm run test:fanout:smoke            # Server-to-server test
```

### Testing
```bash
# Unit tests
npm run test                         # Jest tests
npm run test:watch                   # Watch mode
npm run test:coverage                # Coverage report

# Contract & integration tests
npm run test:ws2                     # WebSocket protocol
npm run test:ws2-audio              # Audio helpers
npm run test:php-schemas            # PHP response validation
bash scripts/test-security-negative.sh  # Comprehensive security

# WebSocket server tests (cd websocket-server)
npm run smoke:auth                   # Auth flow validation
```

### Single Test Execution
```bash
# Jest single file
npm test -- path/to/test.spec.ts

# Single WebSocket test
node scripts/ws2-contract-test.mjs

# PHP single test
docker run --rm -v $(pwd):/app -w /app php:8.2-cli php test_error_responses.php
```

## Architecture

### Three-Layer System
The codebase operates across three distinct runtime environments that communicate via HTTP/WebSocket:

1. **Next.js Layer** (`/app`, `/components`)
   - Routes: `/api/realtime/token` (JWT issuance), `/api/voice/*` (fanout)
   - CORS via `middleware.ts` using `ALLOWED_ORIGINS`
   - Auth via Clerk or dev bypass (`AUTH_DISABLE_CLERK=true`)

2. **PHP Backend** (`/api/*.php`)
   - Business logic: `donna_logic.php`, `marketing.php`, `voice-chat.php`
   - Security: `CORSHelper`, `RateLimiter`, `InputValidator`, `ErrorResponse`
   - Storage: File-based (`/data/`) migrating to PostgreSQL

3. **WebSocket Proxy** (`/websocket-server`)
   - Optional bridge to OpenAI Realtime (disabled by default)
   - Enable with `ENABLE_WS_PROXY=true` + `JWT_SECRET`
   - Limits: 3 connections/IP, JWT required, origin validated

### Voice Processing Flows

**Realtime (Preferred)**: Browser → WebRTC → OpenAI Realtime API
- ~500ms latency, streaming
- Token from `/api/realtime/token` (5min TTL prod, 10min dev)

**Realtime (Proxy)**: Browser → WebSocket → Node Proxy → OpenAI
- Requires `ENABLE_WS_PROXY=true`
- Auth codes: 4001 (timeout), 4003 (invalid token)

**Batch (Legacy)**: Browser → PHP → Whisper → GPT-4 → ElevenLabs
- 3-5s latency, custom voice `XcXEQzuLXRU9RcfWzEJt`

## Security Configuration

### Origin Allowlists (FINALIZED)
```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# Staging
ALLOWED_ORIGINS=https://staging.donna-interactive.com,https://donna-interactive-*.vercel.app

# Production (LOCKED - no wildcards)
ALLOWED_ORIGINS=https://donna-interactive.com,https://www.donna-interactive.com
```

### Rate Limits
- API: 60 req/min per IP
- Token: 10 tokens/min per user
- WebSocket: 3 concurrent per IP

## Working with the Codebase

### Adding New PHP Endpoint
```php
require_once __DIR__ . '/lib/cors.php';
require_once __DIR__ . '/lib/rate-limiter.php';
require_once __DIR__ . '/lib/input-validator.php';

CORSHelper::enforceCORS();
RateLimiter::checkLimit('endpoint', 60);
$input = InputValidator::validate($_POST, [
    'field' => ['required', 'string', 'max:255']
]);
// Business logic
ErrorResponse::send('ERROR_CODE', 'message', [], 400);
```

### Adding New Next.js API Route
```typescript
import { validateEnvironment } from '@/lib/env-validation'
import { requireAuth } from '@/lib/auth-helpers'
import { checkRateLimit } from '@/lib/rate-limiter'

validateEnvironment()
await requireAuth(request)
await checkRateLimit(request, 'endpoint', 60)
```

### Quick Local Dev Setup
```bash
export AUTH_DISABLE_CLERK=true
export JWT_SECRET=dev
export NEXT_PUBLIC_DEV_JWT=dev.header.payload
export OPENAI_API_KEY=sk-...
export ALLOWED_ORIGINS=http://localhost:3000
npm run dev
```

### Remote PHP Fanout
```bash
# Server-to-server only (keeps browser off PHP)
REMOTE_PHP_BASE=https://bemdonna.com/donna
ALLOW_REMOTE_PHP_FANOUT=true
# Do NOT set NEXT_PUBLIC_API_BASE
```

## Data Storage

**Current**: File-based in `/data/` (chat_sessions, memory)
**Migration**: PostgreSQL DAL ready in `lib/dal/`
**Caching**: `CacheManager` with File/APCu/Redis adapters

## CI Pipeline Tests

The CI (`/.github/workflows/ci.yml`) enforces:
1. TypeScript compilation
2. ESLint (zero warnings)
3. Security audit (high severity)
4. WS2 contract tests
5. Negative-path security (401/403)
6. Fanout smoke test
7. PHP schema validation
8. WebSocket auth (4001/4003/success)

## Troubleshooting

**WebSocket fails**: Check `ENABLE_WS_PROXY`, `JWT_SECRET`, origin in `ALLOWED_ORIGINS`
**CORS errors**: Verify origin in `ALLOWED_ORIGINS`, same list in Next.js and PHP
**Token 401/403**: 401=no auth, 403=bad origin, check rate limits (10/min)
**PHP unreachable**: Check `REMOTE_PHP_BASE` and `ALLOW_REMOTE_PHP_FANOUT=true`



## Current Workstreams

- **WS1 Security (CLAUDE)**: ✅ Origins finalized, CI tests complete
- **WS2 Realtime (CODEX)**: WebSocket auth, reconnection
- **WS3 Build (CURSOR)**: Fanout smoke, coverage
- **WS4 Data (AUGMENT)**: PHP standardization, schemas
- **WS5 Docs (WARP)**: Release notes, observability

---
*Key docs: `ARCHITECTURE.md`, `SECURITY.md`, `MVP/workstreams_checkpoint3.md`*