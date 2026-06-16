# ADR: Dev rewrites correctness (exempt Next APIs)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- Dev rewrites shadow Next API routes; `/api/realtime/*` and `/api/voice/*` must remain handled by Next in development.

## Decision
- Add no-op rewrites to preserve Next handling before catch-all PHP rewrites; or move PHP paths under `/donna/api/*` only

## Implementation Steps
1) In `next.config.mjs`, place exemptions for `/api/realtime/:path*` and `/api/voice/:path*`
2) Keep dev-only rewrites disabled in production (already the case)

## Alternatives Considered
- Remove dev rewrites entirely: impacts dev convenience for PHP endpoints

## Consequences
- Positive: Next APIs usable in dev
- Trade-offs: Slightly more config

## Acceptance Criteria
- Hitting `/api/realtime/token` in dev uses Next route

## Test Plan (Smoke)
- Supertest against dev Next server; route returns expected JSON

## Rollback Plan
- Remove exemptions (not recommended)

## Owners
- FE/Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
