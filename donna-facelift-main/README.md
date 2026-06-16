# DONNA Interactive

[![CI](https://github.com/bemgmt/donna-interactive/actions/workflows/ci.yml/badge.svg)](https://github.com/bemgmt/donna-interactive/actions/workflows/ci.yml)

A hybrid Next.js + PHP platform for realtime AI receptionist and voice applications. This repo contains:
- Next.js 14 (App Router) frontend and API routes
- Legacy PHP endpoints for business logic and voice processing
- Optional Node-based WebSocket proxy (secured)
- **Preview note**: Supabase migrations/data have been removed for this facelift preview. Any feature that previously depended on Supabase will short-circuit with a friendly error if invoked; the UI can still be explored without backend data. Set `FACELIFT_PREVIEW=true` in your environment (e.g., Vercel project settings) so the `npm run validate-env` check knows to skip the full Supabase/OpenAI requirements. This flag also disables Clerk so authentication components render as static placeholders.

Start here
- **docs/REPOSITORY_STRUCTURE.md** — Repository organization and development conventions
- docs/AUDIT_EXECUTIVE_SUMMARY.md — High-level audit, delivered work, and dev workarounds
- SECURITY.md — Policies (auth, CORS, token gating, headers, WebSocket)
- RELEASE_CHECKLIST.md — Gates and steps for releases
- docs/ENV_CONFIG_EXAMPLES.md — Dev/stage/prod environment templates
- docs/REMOTE_PHP_SETUP.md — Server-to-server fanout to remote PHP
- docs/OBSERVABILITY.md — Uptime checks, logging/traceId, optional Sentry

Quickstart (development)
1) Env (local dev, Clerk bypass)
   - Set in your shell before starting dev:
     - AUTH_DISABLE_CLERK=true
     - JWT_SECRET=dev
     - NEXT_PUBLIC_DEV_JWT=dev.header.payload
     - OPENAI_API_KEY={{OPENAI_API_KEY}}
     - ALLOWED_ORIGINS=http://localhost:3000
   - Optional local PHP server (for dev stubs):
     - DEV_PHP_BASE=http://127.0.0.1:8000
     - Start: php -S 127.0.0.1:8000 -t .
2) Run Next dev
   - npm install
   - npm run dev
3) Verify
   - npm run test:ws2:all        # Contract + audio helper tests
   - npm run test:security:smoke # CORS + unauthorized token path

Quickstart (server-to-server fanout to remote PHP)
- Safest: keep the browser off PHP (do NOT set NEXT_PUBLIC_API_BASE)
- Set:
  - REMOTE_PHP_BASE=https://bemdonna.com/donna
  - ALLOW_REMOTE_PHP_FANOUT=true
- Verify:
  - curl -i https://bemdonna.com/donna/api/health.php  # PHP health
  - curl -X POST http://localhost:3000/api/voice/fanout -H "Content-Type: application/json" -d '{"ping":"ok"}'

Production prep (minimum)
- ALLOWED_ORIGINS set to your prod/preview domains
- Token TTL policy: 5 minutes in production (10 minutes in development)
- Security smoke and WS2 tests green in CI
- Optional: add external uptime monitor for /api/health

Important scripts
- npm run dev                  # Start Next dev server
- npm run build                # Build
- npm run start                # Start prod server
- npm run lint                 # ESLint (enforces zero warnings)
- npm run test:ws2             # Realtime contract tests
- npm run test:ws2-audio       # PCM16 helper tests
- npm run test:ws2:all         # Both
- npm run test:security:smoke  # Token/CORS smoke

## Code Quality Requirements

ESLint enforcement is now enabled in builds and CI:
- **Build Process**: ESLint violations will fail builds (`ignoreDuringBuilds: false`)
- **CI Pipeline**: All warnings must be resolved (`--max-warnings 0`)
- **ESLint Disable Comments**: Must include proper justification for any rule disables
- **Before Merging**: All linting issues must be resolved - no exceptions

Architecture & workstreams
- ARCHITECTURE.md (high-level flows)
- MVP/workstreams.md and MVP/workstreams_checkpoint2.md (owners and phases)
- MVP/workstreams_checkpoint3.md (Phase 3 finalization plan)

Notes
- Default WebSocket URL: ws://localhost:3001/realtime (if using the optional proxy)
- CORS is enforced in middleware.ts via ALLOWED_ORIGINS
- Dev-time Clerk bypass is for local usage only (never enable in production)

## Owner handoff checklist

Use this to validate a staging/prod setup with your own keys and domains.

- Pre-requisites
  - Node.js 18.x or 20.x, npm 9+
  - Playwright browsers installed (CI installs automatically)
  - Access to required secrets in your environment or secret manager

- Configure environment (choose one)
  - Option A: Copy docs/ENV_CONFIG_EXAMPLES.md into a .env suited to your environment and fill values
  - Option B: Set environment variables in your shell (examples use placeholders you must replace)
    - ALLOWED_ORIGINS=https://yourdomain.com,https://preview.yourdomain.com
    - OPENAI_API_KEY={{OPENAI_API_KEY}}
    - If using Clerk: CLERK_PUBLISHABLE_KEY={{CLERK_PUBLISHABLE_KEY}}, CLERK_SECRET_KEY={{CLERK_SECRET_KEY}}
    - If bypassing Clerk in dev only: AUTH_DISABLE_CLERK=true, NEXT_PUBLIC_DEV_JWT=dev.header.payload
    - JWT_SECRET={{JWT_SECRET}} (for WS proxy tests)
    - Optional server-to-server fanout: REMOTE_PHP_BASE=https://bemdonna.com/donna, ALLOW_REMOTE_PHP_FANOUT=true
    - Optional PHP headers: ENABLE_PHP_SECURITY_HEADERS=true (and CSP toggles per environment)

- Install and start
  - npm ci
  - npm run build
  - npm run start

- Validate locally
  - Health: curl http://localhost:3000/api/health
  - Install Playwright browsers: npx playwright install --with-deps
  - E2E smoke: npx playwright test --grep @smoke
  - Security negative-path smoke: npm run -s test:security:smoke

- Optional realtime/WS tests (if using the proxy)
  - Start the proxy with JWT_SECRET set, then run:
    - npm run test:ws2-auth
    - npm run test:ws2 or npm run test:ws2:all

- Production readiness gates
  - ALLOWED_ORIGINS set to your production/preview domains
  - Token issuance TTL policy: 5 minutes in production (10 minutes in development)
  - CI: lint (zero warnings enforced), unit, Playwright @smoke green
  - Logs contain no sensitive data; error responses use standardized shape with ref id only
  - PHP security headers enabled as appropriate; CSP/HSTS set per environment

- Next steps
  - Optionally add external uptime monitor for /api/health
  - Review MVP/workstreams.md for remaining tasks (by workstream)
  - Review ADR status under MVP/adrs for phase-by-phase completion
# donna-facelift
