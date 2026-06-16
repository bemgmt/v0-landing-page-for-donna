# ADR: Branching: create hardening branch

## Status
- De-scoped (per constraints: no new branches)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 0 — Preparation and Safety Nets
- We need an isolated working branch to land security/perf/config changes safely while protecting main from partial work. This enables phased PRs, easier rollbacks, and coordinated merges.

## Decision
- Do not create new branches. Use the existing workflow on the current default branch.
- Enforce gating via CI status checks (typecheck/lint/audit/tests) before merge.
- Use feature flags and workstreams to coordinate parallel efforts without a dedicated hardening branch.

## Implementation Steps
1) Require CI checks to pass before merging to the existing default branch.
2) Use workstreams (MVP/workstreams.md) and feature flags to isolate risky changes.
3) Document this policy in MVP/workstreams.md and PR templates (optional).

## Alternatives Considered
- Work directly on main: rejected (high risk)
- Short-lived feature branches only: acceptable, but we still need an integration branch across phases

## Consequences
- Positive: Safer iteration, easier coordination
- Trade-offs: Slightly more branch management

## Acceptance Criteria
- No new branches created; merges are gated by CI on the current default branch.

## Test Plan (Smoke)
- Ensure CI triggers on PRs targeting harden branch

## Rollback Plan
- Delete the branch (after merge) or stop targeting it for PRs

## Owners
- Eng Lead; all contributors follow policy

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
