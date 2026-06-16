# Product Requirements Document (PRD)

> Status (2025-09-10): Completed

## Overview
- Phase: 3 — Realtime Architecture Consolidation
- Goal: Remove drift between implementations, standardize protocols, and fix UI defects.

## Objectives
- Standardize on a single message protocol (prefer `connect_realtime`)
- Ensure Next API routes function in development (fix rewrites)
- Fix receptionist UI undefined references
- Choose a single sanctioned realtime path (client-secret + direct Realtime preferred)
- Add reconnect/backoff behavior if WS is retained; centralize config
- Remove references to missing lib/openai-client.js; decide on Clerk usage

## Scope
- In-scope (linked ADRs):
  - [Protocol standard](../adrs/phase-3-task-01-protocol-standard.md)
  - [Dev rewrites](../adrs/phase-3-task-02-dev-rewrites.md)
  - [UI fix: receptionist](../adrs/phase-3-task-03-ui-fix-receptionist.md)
  - [Single realtime path](../adrs/phase-3-task-04-single-realtime-path.md)
  - [Realtime config](../adrs/phase-3-task-05-realtime-config.md)
  - [Reconnect/backoff](../adrs/phase-3-task-06-reconnect-backoff.md)
  - [Remove missing client ref](../adrs/phase-3-task-07-remove-missing-client.md)
  - [Clerk decision](../adrs/phase-3-task-08-clerk-decision.md)
- Out-of-scope: New realtime features

## Success Metrics
- No protocol mismatches; dev Next API responds correctly; UI compiles and renders
- Only one approved realtime path used in app

## Deliverables
- Code/config updates to Next config, client hooks, and components

## Acceptance Criteria
- Matches Phase 3 gate in ../phased_plan.md

## Dependencies
- Phase 2

## Risks & Mitigations
- Risk: Breaking voice features → Mitigation: feature-flag path selection; add E2E stubs

## Rollback
- Re-enable previous path behind flag; revert hooks/config changes

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
