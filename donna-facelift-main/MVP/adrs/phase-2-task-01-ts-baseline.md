# ADR: Fix TypeScript baseline

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 2 — Build Discipline & CI
- `npx tsc --noEmit` fails due to @types/node/TS version mismatch; builds ignore TS errors.

## Decision
- Align `typescript` and `@types/node` versions; pin versions; re-enable type checking in CI

## Implementation Steps
1) Determine a compatible matrix (Node >=18.17, TS 5.x, matching @types/node)
2) Update package.json and lockfile; run `npm ci`
3) Fix any local TS errors flagged by strict mode

## Alternatives Considered
- Keep ignoring errors: rejected

## Consequences
- Positive: Catch errors earlier
- Trade-offs: May require minor code fixes

## Acceptance Criteria
- `npx tsc --noEmit` passes locally and in CI

## Test Plan (Smoke)
- CI job runs `tsc` and fails on regressions

## Rollback Plan
- Temporarily pin less strict TS if absolutely necessary (document)

## Owners
- FE/Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
