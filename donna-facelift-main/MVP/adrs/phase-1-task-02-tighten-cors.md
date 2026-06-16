# ADR: Tighten CORS globally (Next + PHP)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Wildcard CORS (`*`) is enabled for Next API and PHP endpoints, allowing any origin to call sensitive endpoints.

## Decision
- Implement allowlisted origins per environment
- For credentials, never use `*`; reflect only validated origins
- Gate token issuance with both origin and auth checks

## Implementation Steps
1) Next: implement headers() to set Access-Control-Allow-Origin based on env allowlist
2) PHP: add origin validation helper; set headers conditionally; handle OPTIONS preflight
3) Document allowed origins in env and rotate per environment

## Alternatives Considered
- Keep wildcard: rejected due to security risk

## Consequences
- Positive: Prevents cross-origin abuse
- Trade-offs: Must maintain allowlists and handle preflight

## Acceptance Criteria
- Disallowed Origin gets 403/blocked; allowed origin succeeds (tested)

## Test Plan (Smoke)
- curl with Origin header (good/bad) and verify behavior; Playwright e2e stubs network

## Rollback Plan
- Temporarily widen allowlist if needed (not recommended)

## Owners
- BE + Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
