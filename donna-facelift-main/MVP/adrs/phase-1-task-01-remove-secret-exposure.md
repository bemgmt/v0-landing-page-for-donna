# ADR: Remove server secret exposure in PHP realtime helper

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- `api/realtime-websocket.php` exposes `Authorization: Bearer ${OPENAI_API_KEY}` in a response path (get_websocket_url). This is a critical vulnerability.

## Decision
- Remove the endpoint or deprecate with HTTP 410; never return server credentials
- Direct clients to use Next `/api/realtime/token` to obtain client-scoped secrets

## Implementation Steps
1) Delete/disable `handleGetWebSocketUrl` and any code that returns Authorization headers
2) Add 410 Gone with JSON note pointing to `/api/realtime/token`
3) Search the repo for any remaining leakage patterns; add tests

## Alternatives Considered
- Mask token partially: still risky; not acceptable

## Consequences
- Positive: Eliminates key exposure risk
- Trade-offs: Requires client migration to token endpoint

## Acceptance Criteria
- No JSON response includes server Authorization headers; endpoint returns 410 or is removed

## Test Plan (Smoke)
- curl the legacy endpoint: expect 410; verify `/api/realtime/token` flow works (with auth)

## Rollback Plan
- None (do not reintroduce insecure behavior)

## Owners
- BE engineer(s); Security review

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
