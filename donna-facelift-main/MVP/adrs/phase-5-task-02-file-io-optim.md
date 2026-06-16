# ADR: File I/O optimization

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 5 — Performance & Caching
- Chat history and memory read/write patterns are inefficient and synchronous.

## Decision
- Batch writes, lazy-load histories, and avoid persisting response audio artifacts

## Implementation Steps
1) Limit history size; partial load; write-through batching
2) Remove temp response file writes; return base64 directly

## Alternatives Considered
- Keep simple I/O: slower, risk of contention

## Consequences
- Positive: Reduced I/O load
- Trade-offs: Slightly more code path complexity

## Acceptance Criteria
- Fewer file ops per request; no leftover temp files

## Test Plan (Smoke)
- Instrument and assert operation counts in tests

## Rollback Plan
- Revert batching if instability occurs

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
