# ADR: Decide Sentry strategy (init or remove)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 2 — Build Discipline & CI
- Sentry packages present but not initialized. Either wire properly or remove.

## Decision
- If monitoring desired: add Sentry init (DSN in env), minimal performance/error capture
- Otherwise: remove Sentry deps and scripts to reduce footprint

## Implementation Steps
1) Choose: init vs remove
2) For init: add `sentry.client.config` and `sentry.server.config` per Next docs; set DSN in env
3) For remove: uninstall deps and scripts

## Alternatives Considered
- Leave unused: confusing and bloats deps

## Consequences
- Positive: Clear stance on monitoring
- Trade-offs: Slight config work if kept

## Acceptance Criteria
- Sentry either properly initialized and reporting, or fully removed

## Test Plan (Smoke)
- Trigger a test error and verify capture if enabled

## Rollback Plan
- Revert decision (init later or remove later)

## Owners
- Platform/FE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
