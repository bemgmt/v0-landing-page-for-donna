# Workstreams Plan — Checkpoint 2

Date: 2025-09-09
Scope: Next batch of work for five devs (WS1–WS5) to reach Checkpoint 2. Focus on closing remaining WS1/WS4 gaps, refining WS2 UX robustness, tightening WS3 quality gates, and finalizing WS5 docs/monitoring.

Global goals for Checkpoint 2
- Security Gate (final): PHP security headers applied; PHP input validation coverage complete; origin allowlists finalized; proxy posture documented/enforced.
- Data/Privacy Gate (final): Standardized error responses across all PHP endpoints; retention/cleanup automation; response caching for idempotent endpoints.
- Realtime Gate (stability): WebRTC-first UX hardened; VAD toggle optional; graceful degradation; tests solid.
- Build Gate (tightened): ESLint not ignored on build; CI quality gates hardened.
- Docs/Observability (minimal): SECURITY/OPS updated; CI health checks present; Sentry decision documented.

Owners
- WS1 Security & Access Control — CLAUDE
- WS2 Realtime & Voice Architecture — CODEX
- WS3 Build, CI & Quality Gates — CURSOR
- WS4 Data Management, Logging & Error Handling — AUGMENT
- WS5 Repo Hygiene, Docs & Observability — WARP

---

## WS1 — Security & Access Control (Owner: CLAUDE)
Objectives
- Apply PHP security headers across all endpoints.
- Complete PHP input validation coverage using InputValidator.
- Finalize ALLOWED_ORIGINS across envs; document token TTL policy.

Tasks
1) Apply PHP security headers everywhere
- Code: require and call SecurityHeaders::getInstance()->apply() after CORS in all PHP endpoints.
- Files include (non-exhaustive): api/health.php, api/marketing.php, api/marketing-simple.php, api/conversations.php, api/voice-chat.php, api/sales/overview.php, api/chatbot_settings.php, api/donna_logic.php, api/realtime-websocket.php.

2) Input validation coverage
- Use api/lib/input-validator.php to validate all incoming fields per endpoint (emails, ints, enums, safe path components, sizes).
- Replace ad‑hoc checks with explicit validators; on failure, return ErrorResponse validation errors.

3) Origin allowlist and token TTL policy
- Ensure ALLOWED_ORIGINS and PRODUCTION_DOMAIN set in all envs; add brief note to SECURITY.md.
- Confirm token TTL policy is short-lived (≤5m) and documented; add test that asserts issuance path with auth + allowed origin only.

Deliverables
- PR applying SecurityHeaders->apply() to all endpoints.
- PR adding InputValidator usage per endpoint.
- SECURITY.md note for final origin list and token TTL policy.

Acceptance criteria
- curl -I representative PHP endpoints shows X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP (report-only).
- Negative input tests return 400 standardized errors.
- Token issuance works only for allowed origins + auth; logs show traceId; TTL confirmed.

Dependencies
- None (parallelizable with WS4).

Estimate
- 1–1.5 days

---

## WS2 — Realtime & Voice Architecture (Owner: CODEX)
Objectives
- Harden WebRTC-first UX; graceful degradation; optional VAD toggle; ensure playback streaming.

Tasks
1) VAD toggle in UI (optional, off by default)
- UI switch in receptionist/chat widget to enable hands-free (VAD) vs push-to-talk.
- When enabled, send session.update with turn_detection: server_vad; when disabled, explicit response.create after commit.

2) Graceful degradation
- If mic permission denied or device missing: auto fall back to text-only; surface clear UI state; provide retry.

3) Audio playback streaming robustness
- Ensure partial audio delta handling is smooth; small buffering; stop on response.done.
- Add basic user controls (pause/stop) without breaking transcript.

4) Reconnect/backoff polish
- Tune backoff bounds and add jitter; ensure transcript buffer resets correctly across reconnects.

5) Tests
- Extend ws2-contract-test.mjs (or add a second spec) for VAD on/off flows; simulate mic-denied path.

Deliverables
- PR with UI toggle, degradation flow, and improved playback handling.
- Updated tests in scripts/ws2-contract-test.mjs (or scripts/ws2-*.mjs).

Acceptance criteria
- With VAD off: commit+response.create flow passes; with VAD on: speech_stopped auto-responses occur.
- Mic denied: app remains usable with text and no crashes.
- Playback: no stuck “speaking” states; partial audio plays smoothly.

Dependencies
- None.

Estimate
- 1–1.5 days

---

## WS3 — Build, CI & Quality Gates (Owner: CURSOR)
Objectives
- Tighten build gates; ensure linting runs on build; add minimal static analysis.

Tasks
1) Remove ignoreDuringBuilds (Next)
- next.config.mjs: set eslint.ignoreDuringBuilds = false. Keep TS as is (already failing builds on TS errors).

2) CI hardening
- Ensure ESLint runs and blocks on errors in CI; enforce coverage floor (e.g., statements ≥ 60% initially).
- Add a simple semgrep or ESLint security plugin pass (low noise ruleset).

3) Health check stability
- Ensure Next server in CI health step is gracefully killed; add timeout guard for flakiness.

Deliverables
- PR adjusting next.config.mjs and CI workflow.

Acceptance criteria
- CI fails on lint errors.
- WS2 contract test and health check remain green.
- Static analysis job reports and fails on critical patterns.

Dependencies
- None.

Estimate
- 0.5–1 day

---

## WS4 — Data Management, Logging & Error Handling (Owner: AUGMENT)
Objectives
- Finish standardizing error responses; retention cleanup automation; expand response caching for idempotent GETs.

Tasks
1) Standardize responses across all PHP endpoints
- Replace raw success payloads with ErrorResponse::success.
- Ensure all error paths use ErrorResponse helpers; include traceId.

2) Retention & cleanup automation
- Add scripts/cleanup-temp.php to purge temp_audio/* older than N minutes and other temp files; document a cron example in OPS_RUNBOOK.md.

3) Response caching expansion
- Apply CacheManager/ResponseCache for idempotent endpoints (e.g., conversation summaries, simple stats) with safe TTLs.
- Add a small integration test (PHP) showing cache hit/miss behavior.

Deliverables
- PR standardizing responses and adding cleanup script + docs.
- PR enabling caching on at least one more endpoint beyond health.

Acceptance criteria
- Grep shows all endpoints return standardized shapes for both success and error.
- Running cleanup script removes files older than threshold; documented cron entry present.
- Cache integration test passes and hit rate visible in logs.

Dependencies
- None (parallelizable with WS1).

Estimate
- 1–1.5 days

---

## WS5 — Repo Hygiene, Docs & Observability (Owner: WARP)
Objectives
- Finalize docs; optional minimal monitoring; add architecture diagram and a simple checklist.

Tasks
1) Docs refresh
- Update SECURITY.md and OPS_RUNBOOK.md with any new envs (VAD toggle, retention script), final origin allowlist, token TTL note.
- Add ARCHITECTURE.md (high-level diagram and flows: WebRTC, WS proxy as optional, PHP API).
- Add PROD_PREP.md (preflight checklist for production deploy).

2) Monitoring
- Keep Sentry OFF this checkpoint (documented); add optional external uptime monitor instructions for /api/health.

Deliverables
- PR with ARCHITECTURE.md and PROD_PREP.md; updates to SECURITY/OPS docs.

Acceptance criteria
- Docs reference ADRs and checkpoint logs; contain actionable steps.
- CI health check remains in place; optional external monitor instructions included.

Dependencies
- None.

Estimate
- 0.5–1 day

---

Checkpoint 2 Gates & Verification
- Security Gate (WS1):
  - curl -I on PHP endpoints shows required headers; negative inputs return standardized errors; token issuance works only with auth + allowed origin; TTL documented.
- Data/Privacy Gate (WS4):
  - All endpoints standardized for success/error; cleanup script documented and runnable; caching expanded and tested.
- Realtime Gate (WS2):
  - VAD toggle works; mic-denied fallback works; playback robust; tests pass.
- Build Gate (WS3):
  - Lint fails block CI; health checks stable; static analysis runs.
- Docs/Observability (WS5):
  - Security/ops docs updated; architecture and prod prep docs present; CI health check documented.

Parallelization & Order
- WS1 and WS4 can proceed in parallel (security headers/validation vs. standardization/cleanup/caching).
- WS2 and WS3 can proceed in parallel; WS3 changes should not impact WS2 tests.
- WS5 can update docs as changes land.

Risks & Mitigations
- Risk: Overly strict CSP breaking dev flows → use report-only; whitelist required origins.
- Risk: Lint gate flips breaking builds → stage via PRs; fix issues iteratively.
- Risk: Caching stale data → short TTLs; add cache-busting on critical changes.

Owners summary
- CLAUDE (WS1): headers, validation, origins/TTL.
- CODEX (WS2): VAD toggle, degradation, playback, reconnect polish, tests.
- CURSOR (WS3): lint gate on, static analysis, CI stability.
- AUGMENT (WS4): standardize responses, cleanup automation, caching expansion.
- WARP (WS5): docs refresh (ARCHITECTURE.md, PROD_PREP.md), observability note.

