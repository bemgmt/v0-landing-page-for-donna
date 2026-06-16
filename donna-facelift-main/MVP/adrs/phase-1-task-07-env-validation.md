# ADR: Environment variable validation (fail-fast)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Missing envs cause runtime failures or insecure defaults.

## Decision
- Validate required envs at startup for Next and PHP; fail-fast with clear messages

## Implementation Steps
1) Next: add a small module to assert required envs (OPENAI_API_KEY server-side, etc.)
2) PHP: in bootstrap include, check envs and error_log missing keys (do not reveal to clients)
3) Provide `.env.example` with non-sensitive placeholders

## Alternatives Considered
- Lazy validation at call sites: harder to reason about

## Consequences
- Positive: Early detection; safer configs
- Trade-offs: Startup fails if misconfigured

## Acceptance Criteria
- Missing required env causes startup or first-request failure with clear log

## Test Plan (Smoke)
- Unset a required env in dev; verify error and guidance

## Rollback Plan
- Disable validation via env flag temporarily (not recommended)

## Owners
- Platform/BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
