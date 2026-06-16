# Product Requirements Document (PRD)

> Status (2025-09-10): Deferred (branching), Partial (secrets/access scanning)

## Overview
- Phase: 0 — Preparation and Safety Nets
- Goal: Establish safe working practices, prevent secret exposure, and restrict access during hardening.

## Objectives
- Create a dedicated hardening branch to isolate changes
- Perform a secrets hygiene pass and ensure no sensitive data in repo
- Apply temporary access controls to staging/test WS proxies and PHP endpoints

## Scope
- In-scope (linked ADRs):
  - [Branching strategy](../adrs/phase-0-task-01-branching.md)
  - [Secrets hygiene](../adrs/phase-0-task-02-secrets-hygiene.md)
  - [Temporary access controls](../adrs/phase-0-task-03-access-controls.md)
- Out-of-scope: New features unrelated to security hardening

## Success Metrics
- harden/critical-fixes branch exists and is used for all changes
- Secret scans report no credentials in touched files
- Access controls applied for staging/test while hardening

## Deliverables
- Active hardening branch
- Secret scanning report or tool config updates
- Temporary access-control rules applied/documented

## Acceptance Criteria
- No credentials present in updated file history (verified by secret scan)
- Branch created and referenced in work plan
- WS/PHP endpoints restricted for staging/test environments

## Dependencies
- None

## Risks & Mitigations
- Risk: Temporary access restrictions break dev flows → Mitigation: Document bypass for local dev only
- Risk: Secret scanner false positives → Mitigation: Allowlist non-sensitive matches explicitly

## Rollback
- Remove access control rules, delete or merge/revert branch as needed

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
