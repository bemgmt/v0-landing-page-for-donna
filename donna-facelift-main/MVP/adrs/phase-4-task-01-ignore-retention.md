# ADR: Repo ignores & retention (logs/data)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 4 — Data Management & Privacy Posture
- Runtime data and logs should not be tracked; implement retention/rotation and ensure PII minimized.

## Decision
- Ignore `/data/**` and `/api/logs/**` in git; add retention policy (e.g., size-based or time-based rotation)

## Implementation Steps
1) Update .gitignore to include runtime dirs
2) Add simple log rotation (by size/time) in PHP logging utility
3) Document recommended retention durations

## Alternatives Considered
- Keep tracking: risks PII leaks

## Consequences
- Positive: Reduced PII risk, smaller repo
- Trade-offs: Need to fetch logs from server directly

## Acceptance Criteria
- git does not track data/logs; rotation occurs per policy

## Test Plan (Smoke)
- `git status` clean; simulate log growth and verify rotation

## Rollback Plan
- Remove rotation config (not recommended)

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
