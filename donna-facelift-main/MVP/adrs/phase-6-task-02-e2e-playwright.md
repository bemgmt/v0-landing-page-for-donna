# ADR: E2E foundation with Playwright

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 6 — Testing Program
- Need end-to-end confidence using network intercepts (no real API calls).

## Decision
- Add Playwright with fixtures to stub token and event endpoints; test receptionist/chatbot paths

## Implementation Steps
1) Configure Playwright project; global setup for intercepts
2) Add smoke flows and selectors for stability

## Alternatives Considered
- Cypress: Playwright chosen for cross-browser and speed

## Consequences
- Positive: Confidence in flows without hitting external services
- Trade-offs: Maintain fixtures and selectors

## Acceptance Criteria
- `npm run test:e2e` passes under 3 minutes in CI

## Test Plan (Smoke)
- Run suite with all network calls intercepted

## Rollback Plan
- Disable flakey tests with quarantine tag

## Owners
- QA/FE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
