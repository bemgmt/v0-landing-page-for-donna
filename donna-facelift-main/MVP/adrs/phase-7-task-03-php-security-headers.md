# ADR: Security headers for PHP endpoints

## Status
- Partial (2025-09-10)
  - Note: Baseline headers applied (nosniff, frame deny, referrer, permissions). HSTS/CSP staged per environment and will be enabled after validation.

> Constraints (global): Do not create new branches. Do not rotate or delete secrets. All tests must avoid external API calls (use mocks and network intercepts).

## Context
- Phase: 7 — Security Headers & Platform Hardening
- Problem: PHP endpoints lack standard security headers (e.g., X-Frame-Options, X-Content-Type-Options). Adding them reduces risk of clickjacking, MIME sniffing, and XSS exposure.

## Decision
- Add a common include for PHP endpoints to set headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
  - Strict-Transport-Security (when served over HTTPS): 2 years, includeSubDomains, preload
- Evaluate CSP for PHP endpoints that render HTML (if any); for JSON APIs, minimal CSP may be sufficient.

## Implementation sketch
- Create php_security_headers.php under a non-public path and include it at the top of API scripts after CORS setup.

## Alternatives Considered
- Manage headers at reverse proxy only: acceptable if consistently enforced, but keep application-level defaults for portability.

## Consequences
- Positive: Defense-in-depth improvements.
- Trade-offs: Risk of overly strict policies; must test incrementally.

## Acceptance Criteria
- All PHP API responses include the agreed headers; no regressions observed.

## Rollback Plan
- Remove include or disable via env flag (ENABLE_PHP_SECURITY_HEADERS=false).

## Owners
- BE engineer(s)

## References
- ../../critical_audit.md
- ../../phased_plan.md
