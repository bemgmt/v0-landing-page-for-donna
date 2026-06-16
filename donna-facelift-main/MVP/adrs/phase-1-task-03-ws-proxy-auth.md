# ADR: Add auth/rate limits to WS proxy or deprecate

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- `websocket-server/server.js` currently accepts any client and proxies to OpenAI using server API key. This is unsafe without authentication and rate limiting.

## Decision
- Either (preferred) deprecate the proxy in favor of direct client-secret connections via `/api/realtime/token`
- Or secure the proxy with origin validation, authentication (JWT), and rate limiting per IP/session

## Implementation Steps
1) Require an `authenticate` message with a signed token before allowing `connect_realtime`
2) Validate `Origin` header against an allowlist
3) Add per-IP connection caps and rate limits; log events without PII
4) Feature-flag the proxy (ENABLE_WS_PROXY) to allow deprecation

## Alternatives Considered
- Keep proxy open: rejected (critical abuse risk)

## Consequences
- Positive: Prevents unauthorized use of server API key
- Trade-offs: Slightly more client complexity (token acquisition)

## Acceptance Criteria
- Unauthenticated clients rejected; authenticated within limits accepted; proxy can be disabled via env

## Test Plan (Smoke)
- wscat without auth → rejected; with valid token → session established (mocked OpenAI backend)

## Rollback Plan
- Disable proxy entirely (set ENABLE_WS_PROXY=false)

## Owners
- Platform/BE + Security review

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
