# ADR: Choose a single realtime path

## Status
- Partial (2025-09-10)
  - Note: Default path uses client-secret + direct OpenAI Realtime; WS proxy retained behind a feature flag for fallback/testing during rollout.

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- Multiple paths (WebRTC lib, local server, Railway proxy) cause drift.

## Decision
- Prefer client-secret + direct OpenAI Realtime (via `/api/realtime/token`); deprecate unauthenticated proxy

## Implementation Steps
1) Update UI hooks to use token-based flow by default
2) Feature-flag the WS proxy; document fallback only

## Alternatives Considered
- Keep proxy as primary: higher risk

## Consequences
- Positive: Aligns with OpenAI guidance; reduces key exposure
- Trade-offs: Requires browser support for direct connection

## Acceptance Criteria
- Only one sanctioned path is used in app; deprecated path behind flag

## Test Plan (Smoke)
- E2E with token stubs; no external API calls required

## Rollback Plan
- Re-enable proxy behind flag if needed

## Owners
- FE/BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
