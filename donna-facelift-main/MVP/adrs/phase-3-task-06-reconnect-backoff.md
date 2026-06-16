# ADR: Reconnect/backoff strategy (WS/WebRTC)

## Status
- Completed (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 3 — Realtime Architecture Consolidation
- Current code does not implement reconnection/backoff on WS close/error.

## Decision
- Implement exponential backoff reconnect with jitter and max attempts for WS; for WebRTC, re-acquire token and re-init on failure

## Implementation Steps
1) Enhance `useOpenAIRealtime` to handle `onclose/onerror` with backoff
2) Provide cancellation and UI state indicators

## Alternatives Considered
- Immediate reconnect loops: unstable

## Consequences
- Positive: More robust UX
- Trade-offs: Slight complexity in hooks

## Acceptance Criteria
- Simulated drop reconnects within bounded attempts; user sees meaningful status

## Test Plan (Smoke)
- Mock WS server close; ensure hook attempts reconnect per policy

## Rollback Plan
- Disable reconnect via flag if issues occur

## Owners
- FE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
