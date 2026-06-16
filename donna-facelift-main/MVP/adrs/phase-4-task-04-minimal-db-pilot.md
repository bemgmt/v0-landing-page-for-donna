# ADR: Minimal DB pilot (recommended)

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 4 — Data Management & Privacy Posture
- Validate DAL and schema with one flow before broader migration.

## Decision
- Pilot storing chat session metadata in Postgres while keeping transcripts on disk (or vice versa)

## Implementation Steps
1) Implement DAL for pilot entity
2) Add envs and connection handling
3) Migrate only new records; no retroactive migration initially

## Alternatives Considered
- Big bang migration: higher risk

## Consequences
- Positive: Low-risk validation
- Trade-offs: Temporary partial duplication

## Acceptance Criteria
- Pilot flow reads/writes via DB without regressions

## Test Plan (Smoke)
- Unit/integration test DAL

## Rollback Plan
- Switch DAL back to file backend

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
