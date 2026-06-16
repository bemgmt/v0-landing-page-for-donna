# ADR: Root dependencies and script consolidation

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- `server/app.js` and tests reference server deps not in root; duplication with `websocket-server/`.

## Decision
- Prefer running WS and tests inside `websocket-server/` package to avoid duplicating deps
- If root needs server scripts, add minimal required deps; otherwise remove stale references

## Implementation Steps
1) Audit usages of `server/app.js` and test scripts; decide deprecation or move
2) Update package.json scripts to point to `websocket-server/` where appropriate
3) Remove references to missing `lib/openai-client.js` or replace with existing client

## Alternatives Considered
- Add all server deps to root: increases footprint; confusion

## Consequences
- Positive: Clear separation; lighter root
- Trade-offs: Change in dev commands

## Acceptance Criteria
- No unresolved imports; scripts run deterministically

## Test Plan (Smoke)
- Run server/test commands in chosen location

## Rollback Plan
- Re-add root deps if necessary (document why)

## Owners
- Platform/BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
