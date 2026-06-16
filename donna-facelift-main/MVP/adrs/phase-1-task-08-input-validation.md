# ADR: Input validation hardening (PHP + Next APIs)

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Endpoints parse JSON without schema validation; risk of injection/path traversal.

## Decision
- Introduce validation helpers and strict parsing; sanitize known fields

## Implementation Steps
1) PHP: Create validation functions (filter_var for email/int, regex allowlists)
2) Guard file path components (e.g., `chat_id`, `user_id`) against traversal; allow only safe chars
3) Next: validate request bodies and return standardized errors

## Alternatives Considered
- Rely solely on model to sanitize: rejected

## Consequences
- Positive: Reduced attack surface; fewer runtime errors
- Trade-offs: Slightly more boilerplate

## Acceptance Criteria
- Marketing `limit` capped and validated; email fields validated; no unsafe paths constructed

## Test Plan (Smoke)
- Unit tests for validators; fuzz some fields with bad inputs

## Rollback Plan
- Revert helper wiring if issues arise (not recommended)

## Owners
- BE

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
