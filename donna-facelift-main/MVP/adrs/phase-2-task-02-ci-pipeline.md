# ADR: Add CI pipeline (tsc, lint, audit)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 2 — Build Discipline & CI
- No CI ensures code health. Need typecheck, lint, and audit gates on PRs.

## Decision
- Create GitHub Actions workflow running `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm audit --audit-level=moderate`, and tests

## Implementation Steps
1) Add `.github/workflows/quality.yml`
2) Cache npm per lockfile; run steps in matrix if needed
3) Require passing checks for merge

## Alternatives Considered
- Manual checks: error-prone

## Consequences
- Positive: Consistent quality gates
- Trade-offs: CI runtime cost

## Acceptance Criteria
- CI must pass on PRs to merge

## Test Plan (Smoke)
- Open a PR with lint or TS error; verify CI fails

## Rollback Plan
- Disable workflow temporarily (document)

## Owners
- Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
