# ADR: Restrict access to WS/PHP endpoints during hardening

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 0 — Preparation and Safety Nets
- Before fixes land, reduce attack surface by restricting staging/test WS and PHP endpoints to known origins/IPs.

## Decision
- Apply IP allowlists or basic auth on staging/test endpoints
- Optionally disable WS proxy via env flag (ENABLE_WS_PROXY=false) during hardening

## Implementation Steps
1) Web server/firewall: restrict by IP for staging
2) Add simple auth gate (basic/JWT) on `websocket-server/server.js` if needed
3) Document temporary controls and plan removal after Phase 1–2

## Alternatives Considered
- Do nothing: higher risk window

## Consequences
- Positive: Reduced exposure window
- Trade-offs: Temporary friction for testers

## Acceptance Criteria
- Unlisted clients cannot connect to staging WS/PHP endpoints

## Test Plan (Smoke)
- Attempt from unauthorized machine/origin and verify rejection

## Rollback Plan
- Remove allowlists and flags after hardening completes

## Owners
- Platform/Infra + BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
