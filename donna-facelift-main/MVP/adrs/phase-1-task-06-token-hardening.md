# ADR: Token issuance hardening for /api/realtime/token

## Status
- Partial (2025-09-10)
  - Note: Auth check and origin restrictions enforced; negative-path tests added in CI. Per-user/IP rate limiting and final positive-path test coverage to be finalized.

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- The token endpoint issues client secrets; it must require auth, restrict origins, and rate limit.

## Decision
- Require authenticated user/session before issuing client secrets
- Restrict by origin (CORS) and rate limit per user/IP
- Set short TTL and minimal scope on the client secret

## Implementation Steps
1) Add session auth check (e.g., Clerk or custom) to POST handler
2) Verify request Origin against allowlist
3) Log issuance with trace-id; add per-user/IP rate limit
4) Ensure model, voice, and other fields are constrained/sane

## Alternatives Considered
- No auth: rejected

## Consequences
- Positive: Limits abuse; auditability
- Trade-offs: Requires auth wiring

## Acceptance Criteria
- Unauthenticated returns 401/403; authenticated returns client_secret with TTL; origin-restricted

## Test Plan (Smoke)
- Unit test route handler (mock fetch to OpenAI); e2e with network intercept returns fixture

## Rollback Plan
- Temporary bypass for local dev via env flag (documented)

## Owners
- FE/BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
