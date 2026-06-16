# ADR: Unit & integration foundation (Vitest, Testing Library)

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 6 — Testing Program
- No automated tests; need local fast feedback without external API calls.

## Decision
- Add Vitest for unit tests and Testing Library for React components; mock all network calls

## Implementation Steps
1) Configure Vitest; add example unit tests for validators and components
2) Mock fetch for API helpers; verify shapes

## Alternatives Considered
- Jest: also fine; Vitest chosen for speed

## Consequences
- Positive: Faster feedback
- Trade-offs: Some mocks to maintain

## Acceptance Criteria
- `npm run test` passes locally and in CI; no external calls

## Test Plan (Smoke)
- Run unit suite; ensure deterministic

## Rollback Plan
- Switch to Jest if needed

## Owners
- FE/QA

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
