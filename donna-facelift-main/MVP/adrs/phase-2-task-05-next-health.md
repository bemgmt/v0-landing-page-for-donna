# ADR: Add Next API health endpoint (optional)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 2 — Build Discipline & CI
- PHP has `/api/health.php`; consider a Next health endpoint to check Node side.

## Decision
- Add `/api/health-next` that returns `{ ok: true, version, time }` without secrets

## Implementation Steps
1) Create Next API route with cache-control no-store
2) Include app version from env if available

## Alternatives Considered
- Rely on PHP health only: acceptable; this is optional

## Consequences
- Positive: Visibility into Next runtime
- Trade-offs: Minor maintenance

## Acceptance Criteria
- Hitting `/api/health-next` returns JSON with ok=true

## Test Plan (Smoke)
- Supertest integration test

## Rollback Plan
- Remove route if unused

## Owners
- FE/Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
