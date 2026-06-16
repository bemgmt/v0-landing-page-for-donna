# ADR: File permissions hardening (0755/0644)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Code creates directories with 0777; world-writable introduces security risks.

## Decision
- Replace 0777 with 0755 for directories, 0644 for files; use `umask(0022)` where needed; restrict sensitive dirs to 0700 and files to 0600

## Implementation Steps
1) Search/replace `mkdir($*, 0777, true)` → `mkdir($*, 0755, true)`
2) Add `chmod` where files are created to ensure 0644
3) For data/logs containing sensitive content, tighten to 0700/0600 as appropriate

## Alternatives Considered
- Leave as-is: rejected

## Consequences
- Positive: Principle of least privilege
- Trade-offs: May require explicit permission for certain hosts

## Acceptance Criteria
- No instances of 0777 remain; sensitive paths use restricted perms

## Test Plan (Smoke)
- CLI checks: `find`/grep for 0777; runtime creates files/dirs with expected perms

## Rollback Plan
- Revert specific changes if a host requires looser perms (document exception)

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
