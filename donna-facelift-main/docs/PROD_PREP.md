# PROD_PREP.md

Last updated: 2025-09-09
Owner: WARP (WS5)

Purpose
- Preflight checklist to prepare DONNA Interactive for a production deployment.

Core checklist

1) Environment configuration
- ALLOWED_ORIGINS set to canonical domains (comma-separated)
- PRODUCTION_DOMAIN set
- OPENAI_API_KEY present (server-side only)
- OPENAI_REALTIME_MODEL set (optional; default used if unset)
- NEXT_PUBLIC_USE_WS_PROXY=false (prefer WebRTC)
- ENABLE_WS_PROXY=false (prod default). If enabling proxy:
  - JWT_SECRET set and strong
  - ALLOWED_ORIGINS set and verified
- NEXT_PUBLIC_ENABLE_VAD=false (default) and ENABLE_SERVER_VAD=false (default)
- LOG_DIR and other LOG_* variables tuned for retention

2) CORS and security headers
- Next middleware.ts allowlist verified with curl (disallowed → 403; allowed → 200)
- PHP endpoints include SecurityHeaders::apply() and return:
  - X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP (report-only)

3) Authentication & token issuance
- /api/realtime/token requires auth (Clerk or approved JWT) and allowed origin
- Rate limiting active; issuance logs recorded with traceId
- Token TTL policy documented (≤5 minutes)

4) Realtime path selection
- WebRTC-first (token secret) confirmed working; transcripts/audio flow
- WS proxy disabled in prod unless explicitly needed; if used, JWT + origin validation + rate limiting enforced

5) PHP endpoints readiness
- Rate limiter enforced per endpoint
- Input validation using InputValidator; standardized ErrorResponse on error and success
- No 0777 directories; all mkdir use 0755/0700; files 0644/0640

6) Data retention and privacy
- Runtime data/logs not tracked in VCS; .gitignore in place
- Log rotation enabled; retention policy configured
- Temp artifacts (temp_audio, etc.) scheduled cleanup (cron) documented

7) Build and CI quality gates
- next build passes on TS and lint (ESLint not ignored)
- CI runs: tsc, lint, tests, WS2 contract test, health check for /api/health
- Optional static analysis job configured (semgrep or eslint-plugin-security)

8) Observability and monitoring
- Sentry OFF by default for this release (privacy)
- CI health check active; optionally set external uptime monitor for /api/health
- Security logs aggregated (traceId present)

9) Documentation and runbooks
- SECURITY.md updated with origin allowlist and token TTL
- OPS_RUNBOOK.md updated with VAD toggle verification, retention cleanup instructions
- ARCHITECTURE.md committed and accurate

10) Rollback plan
- Ability to disable ENABLE_WS_PROXY in env and redeploy quickly
- Revert VAD toggles to default off if issues
- Roll back to previous known-good build via platform tooling

Verification commands (examples)
- CORS preflight:
  - curl -i -X OPTIONS -H "Origin: https://yourapp.com" -H "Access-Control-Request-Method: POST" https://yourapp.com/api/health
- Token issuance:
  - curl -i -X POST -H "Origin: https://yourapp.com" -H "Authorization: Bearer <valid-token>" https://yourapp.com/api/realtime/token
- Health check:
  - curl -sf https://yourapp.com/api/health | jq .

Sign-off
- Security (WS1): ____  Date: ____
- Data/Logging (WS4): ____  Date: ____
- Realtime (WS2): ____  Date: ____
- Build/CI (WS3): ____  Date: ____
- Docs/Observability (WS5): ____  Date: ____

