# ADR: Pin Node engine and types

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 2 — Build Discipline & CI
- Environment drift causes build/test variability.

## Decision
- Add `engines` in package.json ("node": ">=18.17.0"); document use of a specific Node version

## Implementation Steps
1) Update package.json engines
2) Communicate version to contributors (nvm/asdf hints if applicable)

## Alternatives Considered
- No pinning: variability remains

## Consequences
- Positive: Consistent builds
- Trade-offs: Contributors may need to upgrade Node

## Acceptance Criteria
- CI runs with specified engine; local builds match

## Test Plan (Smoke)
- Verify Node version in CI logs

## Rollback Plan
- Remove engines field (not recommended)

## Owners
- Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
