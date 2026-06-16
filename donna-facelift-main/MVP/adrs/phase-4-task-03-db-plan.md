# ADR: DB migration plan (optional)

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 4 — Data Management & Privacy Posture
- File-based storage limits scalability; plan phased migration to Postgres for core entities.

## Decision
- Create a plan and schema for users, chat_sessions, and memory; define DAL to abstract storage

## Implementation Steps
1) Draft schema and ERD; define indices
2) Add DAL interface; implement file and pg backends
3) Identify one pilot flow to switch in Phase 4/5

## Alternatives Considered
- Stay file-based: limited scalability

## Consequences
- Positive: Enables future scaling and queries
- Trade-offs: Operational overhead

## Acceptance Criteria
- ADR/plan committed with schema and DAL design

## Test Plan (Smoke)
- None (planning ADR)

## Rollback Plan
- N/A

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
