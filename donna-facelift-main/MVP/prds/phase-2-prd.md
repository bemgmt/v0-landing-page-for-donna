# Product Requirements Document (PRD)

> Status (2025-09-10): Completed

## Overview
- Phase: 2 — Build Discipline & CI
- Goal: Restore type safety, lint discipline, and introduce CI quality gates.

## Objectives
- Fix TypeScript baseline (tsc --noEmit passes)
- Add CI pipeline for typecheck, lint, audit; optional build
- Decide on Sentry: initialize or remove; pin engines; add Next health endpoint if desired

## Scope
- In-scope (linked ADRs):
  - [TypeScript baseline](../adrs/phase-2-task-01-ts-baseline.md)
  - [CI pipeline](../adrs/phase-2-task-02-ci-pipeline.md)
  - [Sentry decision](../adrs/phase-2-task-03-sentry-decision.md)
  - [Pin engines](../adrs/phase-2-task-04-pin-engines.md)
  - [Next health endpoint](../adrs/phase-2-task-05-next-health.md)
- Out-of-scope: Feature development

## Success Metrics
- CI runs on PRs and main, failing on type/lint/audit errors
- Local tsc and lint pass

## Deliverables
- CI workflow files; tsconfig and eslint adjustments (if needed)

## Acceptance Criteria
- Matches Phase 2 gate in ../phased_plan.md (CI green, tsc, lint, audit pass)

## Dependencies
- Phase 1

## Risks & Mitigations
- Risk: New CI breaks existing flows → Mitigation: allow manual bypass initially (quarantine), enforce gradually

## Rollback
- Revert CI workflow; retain local scripts

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
