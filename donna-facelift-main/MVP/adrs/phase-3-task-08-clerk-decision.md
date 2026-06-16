# ADR: Clerk dependency decision

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- `@clerk/nextjs` present but not wired; token issuance requires auth.

## Decision
- Either wire Clerk (Provider, middleware, server session) or remove the dependency

## Implementation Steps
1) If adopting: wrap app with ClerkProvider; protect `/api/realtime/token` with session; update env keys
2) If removing: uninstall and update code paths accordingly

## Alternatives Considered
- Keep unused: confusion

## Consequences
- Positive: Clarity on auth strategy
- Trade-offs: Config work if enabled

## Acceptance Criteria
- Token route requires authenticated user (if Clerk adopted) or documented alt auth

## Test Plan (Smoke)
- Issue a token request with/without session; verify behavior

## Rollback Plan
- Change auth provider or remove

## Owners
- FE/Platform

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
