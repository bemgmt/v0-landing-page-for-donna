# MVP Workstreams Plan

Constraints and assumptions
- Not doing: deleting secrets; creating branches
- All tests at checkpoints must run without external API calls (use mocks/fixtures and network intercepts)
- All ADRs are assigned to exactly one workstream; phases can run in parallel if checkpoints pass

Workstreams overview
- WS1 Security & Access Control
- WS2 Realtime & Voice Architecture
- WS3 Build, CI & Quality Gates
- WS4 Data Management, Logging & Error Handling
- WS5 Repo Hygiene, Documentation & Observability

---

## WS1 — Security & Access Control
Scope
- Eliminate credential exposure, restrict CORS, secure WebSocket access, gate token issuance, validate inputs/envs, rate limit PHP APIs, and ship security headers
Primary roles: Security, Backend, Platform
Owner: CLAUDE

ADRs by phase
- Phase 0
  - (Defer) phase-0-task-03-access-controls.md (temporary staging IP allowlisting; optional but recommended)  
- Phase 1
  - phase-1-task-01-remove-secret-exposure.md
  - phase-1-task-02-tighten-cors.md
  - phase-1-task-03-ws-proxy-auth.md
  - phase-1-task-06-token-hardening.md
  - phase-1-task-07-env-validation.md
  - phase-1-task-08-input-validation.md
  - phase-1-task-10-api-rate-limiting.md
- Phase 7
  - phase-7-task-01-security-headers.md (Next)
  - phase-7-task-03-php-security-headers.md (PHP)
  - phase-7-task-02-smtp-path.md (secure outbound email)

Execution notes
- Prioritize Phase 1 ADRs; headers/SMTP can proceed in parallel
- For token issuance: enforce auth + origin checks; short TTL; minimal scope
- For WS proxy: prefer deprecation; if retained, require auth, origin validation, and rate limits

Per‑phase checkpoints and tests (WS1)
- Phase 1 “Security Gate”
  - Conditions
    - No API response path returns Authorization or server secrets
    - CORS deny for disallowed origins; allow for approved origins
    - Unauthenticated WS connections rejected; authenticated + rate‑limited connections succeed
    - Token endpoint requires auth and checks origin; env validation in place
    - Input validation covers known inputs (marketing limit, email fields, file path components)
  - Tests (all mocked/no real external calls)
    - curl with Origin: malicious.tld → 403/blocked; Origin: http://localhost:3000 → 200
    - wscat to WS without auth → close(1008); with valid JWT → session OK (OpenAI stubbed)
    - POST /api/realtime/token without session → 401/403; with session → client_secret JSON
    - Unit tests on validators (emails, ints, safe paths)
- Phase 7 “Headers & SMTP Gate”
  - Conditions
    - Next and PHP return agreed security headers; CSP deployed (report‑only initially)
    - SMTP uses TLS/STARTTLS (PHPMailer path) or hardened raw SMTP with cert checks
  - Tests
    - curl -I against representative routes; check headers present
    - Send test email to sandbox and verify secure transport; error handling covered

---

## WS2 — Realtime & Voice Architecture
Scope
- Standardize message protocol, ensure Next API routes work in dev, fix UI defects, choose single realtime path, unify config, add reconnect/backoff, remove missing client references, decide on Clerk
Primary roles: Frontend, Backend
Owner: CODEX

ADRs by phase
- Phase 3
  - phase-3-task-01-protocol-standard.md
  - phase-3-task-02-dev-rewrites.md
  - phase-3-task-03-ui-fix-receptionist.md
  - phase-3-task-04-single-realtime-path.md
  - phase-3-task-05-realtime-config.md
  - phase-3-task-06-reconnect-backoff.md
  - phase-3-task-07-remove-missing-client.md
  - phase-3-task-08-clerk-decision.md

Execution notes
- Prefer client‑secret + direct Realtime; WS proxy optional behind a feature flag
- Maintain both `connect` and `connect_realtime` during migration; log usage; then remove legacy

Per‑phase checkpoints and tests (WS2)
- Phase 3 “Realtime Gate”
  - Conditions
    - Next APIs unaffected in dev (no shadowing by PHP rewrites)
    - Realtime protocol standardized (clients on `connect_realtime`), UI compiles and renders
    - Single sanctioned path enforced (token‑based), proxy behind flag
    - Reconnect/backoff works for controlled WS close events
  - Tests (mocked/no external calls)
    - Supertest GET /api/realtime/token in dev returns Next route payload
    - Contract test sends both `connect` and `connect_realtime`; both handled; legacy logs deprecation
    - Playwright renders receptionist/chatbot; network intercepts stub tokens/events; flows complete
    - Simulate WS close; verify reconnect attempt policy

---

## WS3 — Build, CI & Quality Gates
Scope
- Fix TypeScript baseline; add CI; pin engines; add Next health; establish unit/integration/e2e tests; security/perf checks
Primary roles: Platform, Frontend, QA
Owner: CURSOR

ADRs by phase
- Phase 2
  - phase-2-task-01-ts-baseline.md
  - phase-2-task-02-ci-pipeline.md
  - phase-2-task-04-pin-engines.md
  - phase-2-task-05-next-health.md (optional)
- Phase 6
  - phase-6-task-01-unit-integration.md
  - phase-6-task-02-e2e-playwright.md
  - phase-6-task-03-sec-perf-checks.md
- Phase 2 or 8 (by decision)
  - phase-2-task-03-sentry-decision.md (if kept, CI can include DSN check)

Execution notes
- CI should fail on type/lint/audit; keep e2e under 3 minutes in CI via intercepts
- Engines pinned to avoid drift; add health endpoint for Next if helpful

Per‑phase checkpoints and tests (WS3)
- Phase 2 “Build Gate”
  - Conditions: tsc passes (no emit), lint passes, audit no high/critical, engines pinned
  - Tests: CI workflow executes tsc, lint, audit; PRs fail on violations
- Phase 6 “Testing Gate”
  - Conditions: baseline unit + e2e (with intercepts) green in CI; security/perf checks wired
  - Tests: `npm run test`, `npm run test:e2e` (mocked), audit/semgrep jobs pass

---

## WS4 — Data Management, Logging & Error Handling
Scope
- Ignore runtime data/logs; minimize PII; standardized client error shape; DB migration plan and minimal pilot; file I/O optimizations; caching for idempotent calls
Primary roles: Backend, Security
Owner: AUGMENT

ADRs by phase
- Phase 4
  - phase-4-task-01-ignore-retention.md
  - phase-4-task-02-minimize-pii.md
  - phase-4-task-05-standardize-error-responses.md
  - phase-4-task-03-db-plan.md
  - phase-4-task-04-minimal-db-pilot.md
- Phase 5
  - phase-5-task-02-file-io-optim.md
  - phase-5-task-01-response-cache.md

Execution notes
- Error responses: non‑sensitive standard shape with trace‑id; logs carry details only
- DB migration starts with a DAL design + minimal pilot using Postgres

Per‑phase checkpoints and tests (WS4)
- Phase 4 “Data/Privacy Gate”
  - Conditions: logs/data untracked, PII‑minimized logs, standardized client error responses, DB plan documented, pilot optional
  - Tests: grep repo for tracked data/logs; unit tests for error shape formatter; DAL unit tests
- Phase 5 “Performance Gate”
  - Conditions: fewer file I/O ops; cache hit ratio observed; no persistent temp files
  - Tests: unit test cache helper; integration test shows cache hits; count I/O operations in mock/instrumented tests

---

## WS5 — Repo Hygiene, Documentation & Observability
Scope
- Remove committed artifacts; extend .gitignore; update docs; configure minimal monitoring or Sentry decision
Primary roles: Platform, PM, Eng
Owner: WARP

ADRs by phase
- Phase 1
  - phase-1-task-05-repo-hygiene.md
- Phase 8
  - phase-8-task-01-update-docs.md
  - phase-8-task-02-monitoring-alerting.md
- Phase 2 or 8
  - phase-2-task-03-sentry-decision.md (coordinate here if treated as observability)
- Phase 0 (De‑scoped per instruction)
  - phase-0-task-01-branching.md — NOTE: Per instruction, no new branches will be created; keep existing workflow
  - phase-0-task-02-secrets-hygiene.md — NOTE: No secret deletion; scanning/allowlisting only and .env ignore verification

Execution notes
- Do not delete secrets from history; only scanning and allowlisting as needed
- No new branches; continue with current workflow while still using CI gates

Per‑phase checkpoints and tests (WS5)
- Phase 1 “Hygiene Gate”
  - Conditions: donna-static/ and websocket-server/node_modules/ removed from VCS; .gitignore extended; no runtime data tracked
  - Tests: git status shows clean; .gitignore rules in place
- Phase 8 “Docs/Monitoring Gate”
  - Conditions: WARP.md/SECURITY.md/ADRs reflect final state; minimal monitoring configured or de‑scoped intentionally
  - Tests: doc lint; health endpoint pings configured (if chosen); reviewers sign‑off

---

## Parallelization plan & cross‑stream coordination
- Immediate parallel work allowed:
  - WS1 Phase 1 security hardening can run with WS3 Phase 2 type/lint/CI and WS2 Phase 3 realtime work, provided WS1 does not block WS2 endpoints (use feature flags)
  - WS4 Phase 4 data/logging and WS5 Phase 1 hygiene can proceed alongside
- Use feature flags for risky changes: ENABLE_WS_PROXY, ENABLE_RESPONSE_CACHE, ENABLE_RECONNECT, ENABLE_PHP_SECURITY_HEADERS
- Token issuance and CORS (WS1) are prerequisites for production‑grade realtime (WS2) but do not block mocked testing

## Global phase completion checkpoints (all streams)
- Phase 1 Security Gate (WS1+WS5)
  - Tests: CORS, WS auth, token gating, validator unit tests, repo hygiene check
- Phase 2 Build Gate (WS3)
  - Tests: tsc, lint, audit; CI required on PRs
- Phase 3 Realtime Gate (WS2)
  - Tests: dev Next route reachable; contract tests; UI renders with intercepts; reconnect/backoff policy tested
- Phase 4 Data/Privacy Gate (WS4)
  - Tests: .gitignore for data/logs; error shape unit tests; DAL plan committed; pilot optional
- Phase 5 Performance Gate (WS4)
  - Tests: cache hit ratio in integration test; temp files not persisted; I/O op counts reduced
- Phase 6 Testing Gate (WS3)
  - Tests: unit + e2e mocked suites stable in CI under 3 minutes; sec/perf checks passing
- Phase 7 Headers & SMTP Gate (WS1)
  - Tests: headers present via curl -I; SMTP secure path verified
- Phase 8 Docs/Monitoring Gate (WS5)
  - Tests: docs updated and linked; monitoring/alerts configured or de‑scoped intentionally

## Ownership & escalation
- WS1 Security & Access: Security Lead + BE
- WS2 Realtime & Voice: FE Lead + BE
- WS3 Build & CI: Platform Lead + FE + QA
- WS4 Data/Logging: BE Lead + Security
- WS5 Repo/Docs/Observability: Platform + PM + Eng

## Notes
- All checkpoints require tests that avoid external API calls; use mocks and network intercepts
- Per instruction: do not delete secrets; do not create branches. ADRs involving these are marked as de‑scoped or scanning‑only

