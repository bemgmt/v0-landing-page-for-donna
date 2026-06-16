# Product Requirements Document (PRD)

> Status (2025-09-10): Completed

## Overview
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Goal: Eliminate credential exposure, restrict CORS, secure WS proxy, harden permissions, and clean the repository.

## Objectives
- Remove any server secret exposure from PHP realtime helper
- Tighten CORS in both Next and PHP
- Add authentication and rate limits to WS proxy (or deprecate it)
- Replace 0777 permissions and improve file perms
- Clean committed build artifacts and nested node_modules; extend .gitignore
- Gate token issuance (/api/realtime/token) with auth
- Add env validation and input validation for PHP
- Ensure missing root dependencies are present or remove unused server code

## Scope
- In-scope (linked ADRs):
  - [Remove secret exposure](../adrs/phase-1-task-01-remove-secret-exposure.md)
  - [Tighten CORS](../adrs/phase-1-task-02-tighten-cors.md)
  - [WS proxy auth/rate limiting](../adrs/phase-1-task-03-ws-proxy-auth.md)
  - [File permission hardening](../adrs/phase-1-task-04-file-perms.md)
  - [Repository hygiene](../adrs/phase-1-task-05-repo-hygiene.md)
  - [Token issuance hardening](../adrs/phase-1-task-06-token-hardening.md)
  - [Environment validation](../adrs/phase-1-task-07-env-validation.md)
  - [Input validation](../adrs/phase-1-task-08-input-validation.md)
  - [Root dependencies decision](../adrs/phase-1-task-09-root-deps.md)
  - [API rate limiting (PHP)](../adrs/phase-1-task-10-api-rate-limiting.md)
- Out-of-scope: New features; performance tuning (handled later)

## Success Metrics
- No API responses contain Authorization headers or server secrets
- Disallowed Origin requests are rejected; allowed origins succeed
- Unauthenticated WS connections rejected; authenticated within rate limits
- No 0777 found in code; .gitignore extended; artifacts removed

## Deliverables
- Code/config changes for CORS, WS auth, file perms, .gitignore, env validation, input validation
- Validation scripts or unit tests for token gating

## Acceptance Criteria
- Matches Phase 1 gate in ../phased_plan.md (no secrets, restricted CORS, WS auth/limits, perms fixed, repo cleaned, token gated)

## Dependencies
- Phase 0

## Risks & Mitigations
- Risk: CORS lockdown breaks integrations → Mitigation: staged allowlist; clear rollout comms
- Risk: WS auth adds friction → Mitigation: provide token minting flow and local bypass via env

## Rollback
- Revert WS auth enforcement and restore previous headers temporarily (not recommended); keep tokens off

## References
- ../CRITICAL_AUDIT.MD
- ../phased_plan.md
