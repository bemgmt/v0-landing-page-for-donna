# ADR: Remove/replace missing client module usage

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- `lib/openai-client.js` referenced by server/test does not exist.

## Decision
- Remove references or replace with existing realtime client

## Implementation Steps
1) Search for imports of `lib/openai-client.js` and update them
2) If needed, create minimal client wrapper around existing library

## Alternatives Considered
- Recreate historical client: unnecessary

## Consequences
- Positive: No unresolved imports
- Trade-offs: Minor refactor

## Acceptance Criteria
- Build succeeds; no missing module errors

## Test Plan (Smoke)
- Run server/test scripts and ensure they start (or are de-scoped)

## Rollback Plan
- Revert if a dependent tool requires legacy client

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
