# ADR: Receptionist UI fix (realtime state/actions)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- Component uses `realtimeState/realtimeActions`, but has 5 copy-paste references to `voiceState/voiceActions`.

## Decision
- Replace undefined refs with `realtimeState/realtimeActions` or remove unused controls

## Implementation Steps
1) Update lines (~277–286) in receptionist-interface.tsx
2) Verify behavior with mocked realtime events

## Alternatives Considered
- Leave as-is: runtime errors

## Consequences
- Positive: Fixes runtime errors; consistent API
- Trade-offs: None

## Acceptance Criteria
- Component compiles and renders; interactions work under mocks

## Test Plan (Smoke)
- Playwright render test with network intercepts; vitest unit shallow render

## Rollback Plan
- Revert if regression found (unlikely)

## Owners
- FE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
