# ADR: Minimize PII in logs

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 4 — Data Management & Privacy Posture
- Logs may contain user messages, emails, etc.; need policy to minimize PII.

## Decision
- Scrub or hash PII (emails/phones); include trace-ids for correlation; never log tokens

## Implementation Steps
1) Centralize logging util; wrap `error_log` with formatter
2) Strip/obfuscate emails/phones; include `ref` id
3) Ensure client responses only include standardized non-sensitive messages

## Alternatives Considered
- Keep verbose logs: unacceptable risk

## Consequences
- Positive: Better privacy posture
- Trade-offs: Less raw context in logs; rely on `ref`

## Acceptance Criteria
- Sample logs show no PII and include `ref`

## Test Plan (Smoke)
- Unit test formatter against sample messages

## Rollback Plan
- Revert formatter (not recommended)

## Owners
- BE/Security

## References
- ../../CRITICAL_AUDIT.MD
- ../../phased_plan.md
