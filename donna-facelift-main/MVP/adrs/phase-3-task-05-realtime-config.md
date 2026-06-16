# ADR: Realtime URL/config unification

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- Hooks and components use different envs/defaults for WS URL.

## Decision
- Centralize config in one module; use `NEXT_PUBLIC_WEBSOCKET_URL` only if proxy retained; otherwise use token-based WebRTC

## Implementation Steps
1) Create `lib/realtime-config.ts` exporting resolved URLs/flags
2) Update hooks/components to import from single source

## Alternatives Considered
- Leave scattered: error-prone

## Consequences
- Positive: Fewer mismatches
- Trade-offs: Small refactor

## Acceptance Criteria
- Single config source imported across consumers

## Test Plan (Smoke)
- Unit test config resolution under different envs

## Rollback Plan
- Inline config temporarily if needed

## Owners
- FE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
