# Observability Quickstart

Purpose
- Provide minimal, actionable guidance to monitor DONNA Interactive across Next, PHP, and the optional WebSocket proxy.

Key health endpoints
- Next.js app: GET /api/health
  - Expected: 200 and JSON with status="healthy"
  - Example: curl -sf http://localhost:3000/api/health | jq
- Remote PHP (server-to-server): GET ${REMOTE_PHP_BASE}/api/health.php
  - Expected: 200 and JSON with ok or status field
  - Example: curl -sf https://bemdonna.com/donna/api/health.php | jq
- WebSocket proxy (optional): GET http://localhost:3001/health
  - Expected: 200 and JSON with status field
  - Example: curl -sf http://localhost:3001/health | jq

External uptime monitoring (suggested)
- Monitor: Next /api/health
  - Interval: 1–5 minutes, 5s timeout, alert on 3 consecutive failures
- Optional monitors:
  - WebSocket proxy /health (if deployed separately)
  - Remote PHP /api/health.php (informational; do not expose credentials)
- GitHub Actions (built-in, minimal): use .github/workflows/uptime.yml with a repository variable `HEALTH_URL` pointing to your deployed Next health endpoint (e.g., https://your-domain.com/api/health).

Logging and trace correlation
- Next token endpoint emits traceIds via the security logger.
- Recommended: include traceId in:
  - Security logs (auth failures, origin blocks, rate-limit events)
  - Error responses (standardized JSON with traceId on errors where possible)
- For PHP logs:
  - Use consistent formats; avoid PII; include minimal context (endpoint, correlation id if available, timestamp).
  - See test_data_privacy_audit.php for PII checks and recommendations.

Alerts (minimum viable)
- Token endpoint errors: spike in 401/403/429
- CORS denials: spike in 403 from middleware
- WebSocket server: auth timeouts (4001), invalid tokens (4003), connection limit breaches
- Health endpoints: non-200 responses

Sentry (recommended for visibility)
- Enable DSNs:
  - Server: `SENTRY_DSN`
  - Client: `NEXT_PUBLIC_SENTRY_DSN`
- What is captured now:
  - Client render errors via `app/global-error.tsx`
  - Handled errors in critical API routes:
    - `app/api/realtime/token/route.ts`
    - `app/api/voice/events/route.ts`
    - `app/api/voice/fanout/route.ts`
  - PHP warnings/fatals via `lib/sentry_error_handler.php` (included from `bootstrap_env.php`)
- How to extend:
  - Add `Sentry.captureException(err)` in API route catch blocks to capture handled errors
  - Use `lib/sentry-api.ts` `apiCall` and `trackPerformance` to add spans for client-side calls
- Hygiene
  - Never log secrets; scrub PII; set sampling (e.g., tracesSampleRate) to control volume

Dashboards (optional)
- A lightweight dashboard can chart:
  - Health checks over time
  - Token issuance status codes (2xx/4xx/5xx)
  - WebSocket connection outcomes and close codes

CI health checks (already configured)
- Security smoke: npm run test:security:smoke
  - Confirms CORS preflight and unauth token blocks
- WS2 tests: npm run test:ws2:all
  - Contract + audio helper tests
- Suggested additions (tracked in CHANGELOG Unreleased):
  - WebSocket auth smoke
  - Fanout smoke to /api/voice/fanout (expect success:true)

Operational runbook pointers
- See docs/AUDIT_EXECUTIVE_SUMMARY.md for architecture and toggles (VAD, proxy, Clerk bypass)
- See RELEASE_CHECKLIST.md for preflight gates
- See SECURITY.md for policies (CORS, token TTL, WebSocket close codes)

