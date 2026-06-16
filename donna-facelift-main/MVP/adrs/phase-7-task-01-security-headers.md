# ADR: Add security headers in Next

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 7 — Security Headers & Platform Hardening
- Add standard headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc.).

## Decision
- Implement headers() returning a standard set; deploy CSP as report-only first

## Implementation Steps
1) Add `securityHeaders` array in next.config.mjs
2) Start with report-only CSP; tighten iteratively

## Alternatives Considered
- Rely on proxy: acceptable but we keep app-level defaults for portability

## Consequences
- Positive: Defense in depth
- Trade-offs: Risk of breakage if CSP too strict

## Acceptance Criteria
- Headers present; no major regressions; CSP reports collected (if enabled)

## Test Plan (Smoke)
- curl -I; Playwright checks header presence

## Rollback Plan
- Disable CSP or revert headers

## Owners
- Platform/FE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
