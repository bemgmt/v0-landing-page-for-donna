# ADR: Update repo docs

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 8 — Documentation & Monitoring
- Docs must reflect the finalized architecture and policies.

## Decision
- Update WARP.md, add SECURITY.md (threat model, incident response), and ADR index; ensure phased_plan.md remains source of truth for phases

## Implementation Steps
1) Edit docs and cross-link
2) Add ADR index in MVP/adrs/README.md (optional)

## Alternatives Considered
- Leave stale docs: confusion

## Consequences
- Positive: Shared understanding
- Trade-offs: Maintenance overhead

## Acceptance Criteria
- Docs updated and linked; reviewers sign off

## Test Plan (Smoke)
- Lint links; quick review checklist

## Rollback Plan
- Revert specific doc changes

## Owners
- Eng + PM

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
