# ADR: Security & performance checks (audit/semgrep)

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 6 — Testing Program
- Need lightweight automated checks beyond unit/e2e.

## Decision
- Add `npm audit --audit-level=moderate` and optional `semgrep --config=auto` to CI

## Implementation Steps
1) Extend CI workflow with security job
2) Allow explicit allowlist for false positives

## Alternatives Considered
- Full SAST/DAST: out of scope for MVP

## Consequences
- Positive: Early warning on known issues
- Trade-offs: Occasional false positives

## Acceptance Criteria
- CI fails on high/critical vulnerabilities; semgrep passes or has justified allowlist

## Test Plan (Smoke)
- Introduce a known vulnerable dep in a test branch; verify CI fails

## Rollback Plan
- Disable semgrep if too noisy; keep audit

## Owners
- Platform/Security

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
