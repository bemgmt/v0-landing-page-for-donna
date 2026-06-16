# ADR: Monitoring & alerting

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 8 — Documentation & Monitoring
- We need minimal monitoring to detect outages; choose Sentry or uptime pings.

## Decision
- If Sentry is enabled: configure DSN and basic alerts; else add uptime ping checks to health endpoints

## Implementation Steps
1) Add monitors for `/api/health.php` and `/api/health-next` (if added)
2) Configure alert thresholds and contacts

## Alternatives Considered
- Full observability stack: out of scope for MVP

## Consequences
- Positive: Early detection of regressions
- Trade-offs: Some maintenance

## Acceptance Criteria
- Alerts fire on simulated outage; documented procedures

## Test Plan (Smoke)
- Temporarily break health endpoint in staging; verify alert

## Rollback Plan
- Disable monitors

## Owners
- Platform/PM

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
