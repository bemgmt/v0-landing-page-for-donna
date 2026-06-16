# Product Requirements Document (PRD)

> Status (2025-09-10): Partial (standardized responses in progress; schema CI wired)

## Overview
- Phase: 4 — Data Management & Privacy Posture
- Goal: Reduce PII risk, ignore runtime data in VCS, and plan DB migration.

## Objectives
- Ensure logs/data directories are git-ignored and not committed
- Minimize PII in logs; standardize error responses (no internal details to clients)
- Draft database migration plan; optional minimal pilot for a single flow

## Scope
- In-scope (linked ADRs):
  - [Ignore & retention policy](../adrs/phase-4-task-01-ignore-retention.md)
  - [Minimize PII in logs](../adrs/phase-4-task-02-minimize-pii.md)
  - [DB migration plan](../adrs/phase-4-task-03-db-plan.md)
  - [Minimal DB pilot](../adrs/phase-4-task-04-minimal-db-pilot.md)
  - [Standardize error responses](../adrs/phase-4-task-05-standardize-error-responses.md)
- Out-of-scope: Full DB migration (unless trivial pilot)

## Success Metrics
- git status clean for data/logs; sanitized logs
- ADR and plan committed for DB; pilot optional but documented if executed

## Deliverables
- .gitignore updates; logging changes; ADRs; migration plan or pilot

## Acceptance Criteria
- Matches Phase 4 gate in ../phased_plan.md

## Dependencies
- Phase 3

## Risks & Mitigations
- Risk: Over-sanitization reduces debugging value → Mitigation: keep correlational IDs without PII

## Rollback
- Revert .gitignore/logging changes if necessary (not recommended)

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
