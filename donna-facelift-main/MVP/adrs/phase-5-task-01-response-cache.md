# ADR: Response caching for idempotent calls

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 5 — Performance & Caching
- Repeated expensive calls (e.g., marketing inbox proxy) can be cached safely.

## Decision
- Add read-through cache with Redis/APCu for idempotent endpoints; conservative TTL

## Implementation Steps
1) Introduce cache layer with helper (get/set JSON)
2) Define cache keys as hash(messages, model) or endpoint + params
3) Add metrics to observe hit rate

## Alternatives Considered
- No caching: higher latency/cost

## Consequences
- Positive: Faster responses; lower costs
- Trade-offs: Stale data risk; TTL tuning required

## Acceptance Criteria
- Cache hit rate measurable; latency reduced in controlled test

## Test Plan (Smoke)
- Unit tests for cache helper; integration test showing hit after first request

## Rollback Plan
- Disable via env flag

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
