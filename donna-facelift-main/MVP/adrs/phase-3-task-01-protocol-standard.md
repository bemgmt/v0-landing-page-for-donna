# ADR: Standardize message protocol (connect vs connect_realtime)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- Different servers/clients use `connect` vs `connect_realtime` leading to mismatches.

## Decision
- Standardize on `connect_realtime`; accept both during migration and log usage

## Implementation Steps
1) Update server handlers to accept both; emit deprecation warning for `connect`
2) Update clients to use `connect_realtime`
3) Remove `connect` support after 1–2 cycles

## Alternatives Considered
- Keep both indefinitely: confusion persists

## Consequences
- Positive: Clear contract
- Trade-offs: Temporary duplication of handlers

## Acceptance Criteria
- No errors due to mismatched message types; telemetry shows `connect_realtime` usage predominates

## Test Plan (Smoke)
- WS contract tests send both types and assert handling

## Rollback Plan
- Keep both if migration delayed

## Owners
- FE/BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
