# ADR: Repository hygiene (.gitignore, remove artifacts)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Build artifacts and nested node_modules were committed; runtime data/logs not ignored.

## Decision
- Extend .gitignore with `/donna-static/**`, `/websocket-server/node_modules/**`, `/api/logs/**`, `/data/**`
- Remove committed artifacts from VCS history (normal rm suffices for now)

## Implementation Steps
1) Update .gitignore entries
2) `git rm -r donna-static/ websocket-server/node_modules/`
3) Ensure data/logs paths are untracked and kept local only

## Alternatives Considered
- Keep committed artifacts: rejected

## Consequences
- Positive: Smaller repo; reduced PII risk
- Trade-offs: None

## Acceptance Criteria
- `git status` clean; artifacts and runtime dirs untracked

## Test Plan (Smoke)
- `git status` shows no donna-static, node_modules, logs, or data

## Rollback Plan
- Re-add entries (not recommended)

## Owners
- Eng contributors

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
