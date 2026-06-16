# ADR: API rate limiting for PHP endpoints

## Status
- Partial (2025-09-10)

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 1 — Critical Security Fixes & Repository Hygiene
- Problem: PHP endpoints (e.g., api/donna_logic.php, api/marketing.php, api/sales/overview.php) accept unauthenticated traffic with permissive CORS. Abuse or accidental bursts can overwhelm resources or amplify attack surface.

## Decision
- Add lightweight per-IP and per-endpoint rate limiting at the PHP layer.
- Start with fixed window limits that are environment-specific (e.g., dev higher, prod stricter).
- Log limit events with minimal metadata (no PII) for observability.

## Implementation sketch
- Use a server-local storage (APCu or filesystem) keyed by (IP, endpoint) with TTL.
- For shared hosting without APCu, fallback to file-based counters under a non-public path with flock to avoid race conditions.
- Return 429 Too Many Requests with a JSON body { ok: false, error: 'rate_limited' } when exceeded.

## Alternatives Considered
- Reverse proxy (NGINX/Cloudflare) rate limiting: better performance but not always available.
- JWT-based quotas: requires auth rollout first; defer.

## Consequences
- Positive: Immediate reduction in abuse risk; protects resources.
- Trade-offs: Slight latency overhead; risk of false positives; must tune limits.

## Acceptance Criteria
- Disallowed rates trigger HTTP 429 consistently; allowed traffic unaffected under normal use.
- Limits configurable by env; logs emitted without PII.

## Rollback Plan
- Disable limiter via environment flag (e.g., ENABLE_PHP_RATE_LIMITING=false) and remove hooks.

## Owners
- BE engineer(s); Security review.

## References
- ../../critical_audit.md
- ../../phased_plan.md
