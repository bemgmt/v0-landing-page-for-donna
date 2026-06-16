# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning (pre-1.0).

## [Unreleased]
- PHP response schema standardization (ApiResponder) — planned
- WebSocket auth smoke in CI — planned
- Fanout smoke in CI — planned
- Observability quickstart doc; issue/PR templates; CI badge in README — added

## [0.2.0-rc.2] — 2025-09-10
### Added
- Workstreams Checkpoint 3 plan (MVP/workstreams_checkpoint3.md)
- ADR status summary added to Audit Executive Summary
- README linked to Checkpoint 3 plan; clarified uptime workflow usage (HEALTH_URL)

### Changed
- Executive Summary updated with Workstream Audit and contributors snapshot

### Notes
- This RC captures the planning and documentation updates required to close Phase 3 gates (WS1–WS5) while technical CI smokes and WS4 standardization remain tracked as separate deliverables.

## [0.2.0-rc.1] — 2025-09-10
### Added
- SECURITY.md, RELEASE_CHECKLIST.md, docs/ENV_CONFIG_EXAMPLES.md, docs/REMOTE_PHP_SETUP.md, docs/AUDIT_EXECUTIVE_SUMMARY.md with update history
- CI guardrails: TypeScript, ESLint, npm audit, health check, WS2 tests, security smoke
- Remote PHP fanout (server-to-server) with env flags: REMOTE_PHP_BASE + ALLOW_REMOTE_PHP_FANOUT

### Changed
- CORS centralized in middleware.ts with allowlist; removed wildcard headers from Next config
- /api/realtime/token hardened: auth (Clerk or dev JWT), origin validation, rate limiting, input sanitation, security headers
- Realtime UX: VAD default OFF; push-to-talk explicit commit/response; WebRTC preferred; WS proxy secured and tested
- Dev-time Clerk bypass support: AUTH_DISABLE_CLERK + NEXT_PUBLIC_DEV_JWT for local testing
- Next dev rewrites parameterized via DEV_PHP_BASE (default http://127.0.0.1:8000)

### Fixed
- Multiple TS/typing issues in token route and middleware
- Mismatches between docs and implementation (token TTL, WS path, close codes)

### Security
- Strict origin allowlist and token endpoint gating with trace IDs
- WebSocket proxy origin defaults, connection auth timeouts (4001), invalid token close (4003)

[Unreleased]: https://example.com/compare/0.2.0-rc.1...HEAD
[0.2.0-rc.1]: https://example.com/releases/0.2.0-rc.1
