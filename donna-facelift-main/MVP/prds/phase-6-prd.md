# Product Requirements Document (PRD)

> Status (2025-09-10): Partial (smokes and ws2 present; optional coverage/e2e limited)

## Overview
- Phase: 6 — Testing Program (Foundation & Ongoing)
- Goal: Establish reliable unit/integration/e2e smoke testing with mocks.

## Objectives
- Unit/integration tests (Vitest/Supertest/Testing Library)
- E2E tests (Playwright) with network intercepts (no external calls)
- Security/performance checks integrated into CI

## Scope
- In-scope (linked ADRs):
  - [Unit & integration foundation](../adrs/phase-6-task-01-unit-integration.md)
  - [E2E with Playwright](../adrs/phase-6-task-02-e2e-playwright.md)
  - [Security & performance checks](../adrs/phase-6-task-03-sec-perf-checks.md)
- Out-of-scope: Full coverage; aim for smoke and critical-path coverage first

## Success Metrics
- Tests run locally and in CI; no external API calls; stable under 3 minutes

## Deliverables
- Test scaffolding, example tests, CI integration

## Acceptance Criteria
- Matches Phase 6 gate in ../phased_plan.md

## Dependencies
- Phase 5

## Risks & Mitigations
- Risk: Flaky E2E → Mitigation: quarantine tag; stabilize selectors, use mocks

## Rollback
- Temporarily disable failing tests via quarantine while fixing

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
