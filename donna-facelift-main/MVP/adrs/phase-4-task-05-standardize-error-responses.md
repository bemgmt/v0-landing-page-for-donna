# ADR: Standardize API error responses (no sensitive details)

## Status
- Completed (2025-09-10)
  - Note: Standard error shape implemented in Next and PHP; CI includes schema validation and comprehensive error tests; client responses carry only ref ids with details in server logs.

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 4 — Data Management & Privacy Posture
- Problem: Some endpoints return detailed errors; logs may contain sensitive context. Clients should receive standardized, non-sensitive error payloads with an internal reference.

## Decision
- Define a uniform error shape for client responses across PHP and Next API routes:
  - `{ ok: false, error: 'GENERIC_CODE', message: 'Short non-sensitive summary', ref?: 'trace-id' }`
- Keep detailed diagnostics in server logs only; attach a `ref` (trace-id) in the client response for support correlation.

## Implementation sketch
- Introduce helper functions in PHP and Next to format errors.
- Ensure exceptions are caught at boundaries and mapped to the standardized shape.

## Alternatives Considered
- Expose more details to clients: rejected due to information disclosure risk.

## Consequences
- Positive: Reduces leakage; consistent UX for error handling.
- Trade-offs: Slightly less immediate client-side debug info; requires log hygiene.

## Acceptance Criteria
- All API error responses match the standard shape; no stack traces or internal paths in client payloads.

## Rollback Plan
- Revert helper usage; ensure logs still capture sufficient diagnostics.

## Owners
- BE engineer(s)

## References
- ../../critical_audit.md
- ../../phased_plan.md
