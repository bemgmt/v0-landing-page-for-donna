# Workstreams Plan — Checkpoint 3 (Phase 3 Finalization)

Date: 2025-09-10
Scope: Finalize the last set of tasks to close Phase 3 gates across WS1–WS5 and prepare a release candidate.

Owners
- WS1 Security & Access Control — CLAUDE
- WS2 Realtime & Voice Architecture — CODEX
- WS3 Build, CI & Quality Gates — CURSOR
- WS4 Data Management, Logging & Error Handling — AUGMENT
- WS5 Repo Hygiene, Docs & Observability — WARP

Global goals for Checkpoint 3
- Security Gate (final): origin allowlists finalized; token issuance negative-path CI; docs reflect TTL (5m prod/10m dev)
- Realtime Gate (final): WS auth smoke in CI (4001/4003/auth_success); VAD/PTT UX unchanged; reconnection stable
- Build Gate (tightened): fanout smoke in CI; optional coverage floor
- Data/Privacy Gate (stride): PHP response schema standardized for priority endpoints; schema-check wired in CI; retention cron guidance in OPS_RUNBOOK
- Docs/Observability: RC notes and CHANGELOG; uptime workflow configured with HEALTH_URL

---

## WS1 — Security & Access Control (Owner: CLAUDE)
Objectives
- Finalize origin allowlists per environment; add negative-path CI for token issuance

Tasks
- WS1-P3-01 Finalize origin allowlists
  - Set ALLOWED_ORIGINS for dev/preview/prod and record in SECURITY.md and ENV examples
- WS1-P3-02 Token negative-path CI assertions
  - Add curl-based steps to CI: unauthorized POST to /api/realtime/token → 401; bad Origin → 403

Deliverables
- PR updating env docs and CI workflow (negative-path assertions)

Acceptance criteria
- CI fails on unauth or bad-origin token requests
- SECURITY.md shows final origin allowlist guidance per environment

Dependencies
- None

Estimate
- 0.5 day

---

## WS2 — Realtime & Voice Architecture (Owner: CODEX)
Objectives
- Add WebSocket auth smoke in CI; keep VAD/PTT UX and reconnection behavior stable

Tasks
- WS2-P3-01 WebSocket auth smoke in CI
  - Connect to /realtime (proxy) and exercise 3 paths: (1) no auth → 4001, (2) invalid token → 4003, (3) valid token → auth_success
- WS2-P3-02 (Optional) latency logging
  - Add light instrumentation to track transcript and audio delta timing; expose basic counters/logs

Deliverables
- PR adding a script (ws2-ws-auth-smoke.mjs) and a CI step to run it

Acceptance criteria
- CI step passes with expected close codes and success path
- No regressions to VAD/PTT flows; ws2 tests remain green

Dependencies
- JWT_SECRET and ENABLE_WS_PROXY provided in CI (for this smoke only)

Estimate
- 0.5 day

---

## WS3 — Build, CI & Quality Gates (Owner: CURSOR)
Objectives
- Add fanout smoke to CI; optional coverage floor; ensure health step is resilient

Tasks
- WS3-P3-01 Fanout smoke test in CI
  - POST /api/voice/fanout → expect { success: true }
- WS3-P3-02 (Optional) Coverage floor
  - Set an initial global coverage floor (e.g., 15–20%)
- WS3-P3-03 Health step resilience
  - Ensure Next server startup teardown is robust; guard against port conflicts

Deliverables
- PR updating CI workflow with fanout smoke and (optional) coverage

Acceptance criteria
- CI fails on fanout smoke errors
- Coverage floor enforced if adopted

Dependencies
- REMOTE_PHP_BASE and ALLOW_REMOTE_PHP_FANOUT configured in CI environment if hitting remote; otherwise stub endpoints

Estimate
- 0.5–1 day

---

## WS4 — Data Management, Logging & Error Handling (Owner: AUGMENT)
Objectives
- Standardize PHP response schema for priority endpoints; wire schema-check in CI; document retention cron

Tasks
- WS4-P3-01 ApiResponder and priority endpoint migration
  - Introduce/confirm ApiResponder (jsonSuccess/jsonError + traceId + security headers)
  - Migrate priority endpoints: api/health.php, api/donna_logic.php, api/marketing.php, api/conversations.php, api/voice-chat.php, api/sales/overview.php, api/chatbot_settings.php
- WS4-P3-02 CI schema-check
  - Add scripts/ci-php-schema-check.mjs to validate { success: boolean, traceId: string } on the above endpoints
- WS4-P3-03 Retention cleanup in OPS_RUNBOOK
  - Add a cron example for cleanup of temp files/logs with thresholds

Deliverables
- PR standardizing responses on priority endpoints and adding schema-check to CI

Acceptance criteria
- CI schema-check passes for all migrated endpoints
- Backward compatibility maintained (no breaking consumers)

Dependencies
- None

Estimate
- 1–1.5 days

---

## WS5 — Repo Hygiene, Docs & Observability (Owner: WARP)
Objectives
- RC documentation; CHANGELOG entry; ensure uptime workflow configured; update Executive Summary

Tasks
- WS5-P3-01 Release candidate notes (CHANGELOG + README)
  - Add a 0.2.0-rc.2 entry summarizing Phase 3 closures
- WS5-P3-02 Uptime workflow configuration
  - Set repository variable HEALTH_URL; document in Observability
- WS5-P3-03 Executive Summary and ADRs
  - Add ADR statuses and mark completed items; update docs/AUDIT_EXECUTIVE_SUMMARY.md accordingly

Deliverables
- PR with RC notes and Executive Summary updates

Acceptance criteria
- CHANGELOG updated; docs cross-linked; uptime workflow reads HEALTH_URL

Dependencies
- Completion signals from WS1–WS4 tasks

Estimate
- 0.5 day

---

## Checkpoint 3 Gates & Verification
- Security Gate (WS1):
  - Unauthorized/bad-origin token requests blocked in CI; origin docs finalized
- Realtime Gate (WS2):
  - WS auth smoke in CI exercises 4001/4003/auth_success; ws2 tests still green
- Build Gate (WS3):
  - Fanout smoke in CI passes; optional coverage floor active
- Data/Privacy Gate (WS4):
  - Priority PHP endpoints standardized; schema-check passes
- Docs/Observability (WS5):
  - RC notes in CHANGELOG; HEALTH_URL set for uptime workflow; Executive Summary/ADR statuses updated

## Risks & Mitigations
- Risk: CI flakiness on Next startup/ports → add timeouts/backoff and ensure teardown
- Risk: Backward-compat on PHP responses → rollout priority endpoints first and keep shape compatible (include legacy fields)
- Risk: Remote fanout endpoint availability → allow optional local stubbing in CI or retry

## Parallelization & Order
- WS1, WS2, WS3, and WS4 tasks can proceed in parallel; WS5 wraps once green signals arrive
- Suggest order: WS2/WS3 smokes → WS4 standardization → WS1 allowlist CI → WS5 RC

