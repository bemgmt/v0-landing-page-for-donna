# Phased Remediation Plan for DONNA Interactive

Scope
- Purpose: Organize all audit findings into an exhaustive, actionable, and verifiable plan without losing technical detail
- Inputs: critical_audit.md (including Appendix and Accuracy Assessment), repository state, and verified code references
- Outcomes: Secure-by-default system, reproducible builds, consolidated realtime architecture, reliable data handling, and a testing/CI regime
- Guiding principles: Small, reversible changes; strict gates; no secret exposure; minimal production blast radius; mock external services in tests

How to use this plan
- Each phase lists: objectives, tasks, acceptance criteria, smoke/e2e gates, owners, estimate, risks, rollback
- Phases are sequenced but can overlap when risk is low; do Phase 1 completely before any deploy

Timeline (high-level)
- Phase 0: Prep (0.5–1 day)
- Phase 1: Critical security fixes and repo hygiene (1–2 days)
- Phase 2: Build discipline & CI (1–2 days)
- Phase 3: Realtime architecture consolidation (2–3 days)
- Phase 4: Data management & privacy posture (2–4 days)
- Phase 5: Performance & caching (2–4 days)
- Phase 6: Testing program (ongoing; first week to establish baseline)
- Phase 7: Security headers & platform hardening (1–2 days)
- Phase 8: Documentation & monitoring (1–2 days)

Phase 0 — Preparation and Safety Nets
Objectives
- Contain risk, set working practices, and establish gating
Tasks
- Branching: Create a long-lived hardening branch (e.g., harden/critical-fixes)
- Secrets hygiene: Verify no secrets in repo (NEXT_PUBLIC_* are public by definition). Audit .env handling (Next, PHP bootstrap_env)
- Access controls: Restrict access to test/staging WS proxies and PHP endpoints to known IPs while hardening
Acceptance criteria
- No credentials in repo history for newly touched files; secret scan shows clean
- harden/critical-fixes branch created
Smoke/e2e
- Smoke: run a simple static lint-type scan (no secrets printed) locally
Owners/Estimate/Risks/Rollback
- Owner: Eng lead + security; 0.5 day; low risk; rollback: branch only

Phase 1 — Critical Security Fixes & Repository Hygiene
Objectives
- Remove credential exposure, lock down unauthorized access, restrict CORS, and clean repo artifacts
Tasks
1) Remove server secret exposure in PHP realtime helper
- File: api/realtime-websocket.php
- Action: Delete/disable any code path that returns Authorization: Bearer ${OPENAI_API_KEY} to clients (e.g., handleGetWebSocketUrl). Prefer returning 410 Gone with guidance to use /api/realtime/token
- Acceptance: Grep for Authorization header in responses returns none; endpoint returns 410 or is removed
2) Tighten CORS globally
- Next: Replace wildcard * headers for /api/:path* with env-allowlisted origins per environment (dev: http://localhost:3000, prod: https://<your-domain>)
- PHP: Replace header("Access-Control-Allow-Origin: *") with whitelist-based implementation; support credentials only for non-* origins
- Acceptance: Requests from disallowed Origin fail; allowed Origin succeeds
3) Add auth/rate limits to WS proxy or disable/deprecate
- websocket-server/server.js: Require auth token (e.g., short-lived JWT) before proxying; validate Origin; rate limit per IP/session
- Alternatively, disable the proxy and adopt the Next /api/realtime/token client-secret flow exclusively
- Acceptance: Unauthenticated connections rejected; authenticated connections succeed; rate limit enforced in tests
4) File permissions hardening
- Replace mkdir(..., 0777, true) with 0755 for dirs; use 0644 for files; consider umask(0022) where relevant
- Acceptance: Repo search shows no 0777
5) Repository hygiene
- Add to .gitignore: /donna-static/**, /websocket-server/node_modules/**, /api/logs/**, /data/** (and other runtime folders)
- Remove committed artifacts: donna-static/** and websocket-server/node_modules/** from VCS
- Acceptance: git status clean; only code/config changes remain
6) Token issuance hardening
- /api/realtime/token: Require a form of auth/session check before issuing a client secret; log issuance; set TTL; scope minimal permissions
- Acceptance: Unauthenticated token requests return 401/403; authenticated requests return client_secret JSON
7) Environment variable validation (fail-fast)
- Add startup checks for required vars across runtimes (Next API, PHP): OPENAI_API_KEY, OPENAI_REALTIME_MODEL (optional), ELEVENLABS_API_KEY, SMTP settings, NEXT_PUBLIC_API_BASE/NEXT_PUBLIC_WEBSOCKET_URL (where applicable)
- Acceptance: Missing required envs fail fast with clear error; diagnostics logged without secrets
8) Input validation hardening
- Normalize JSON parsing and validate inputs for all PHP endpoints (marketing.php, voice-chat.php, donna_logic.php, realtime-websocket.php) and Next API routes; sanitize/escape outputs
- Acceptance: Invalid payloads return 400 with stable error schema; internal logs capture context only
9) Root dependencies and script consolidation
- Decide: (a) move local Node server/tests exclusively under websocket-server/, or (b) add root deps (express, cors, ws, dotenv, openai) to support server/app.js and test scripts
- Acceptance: No missing-module runtime errors; one authoritative location to run WS tests/servers is documented
Acceptance criteria (Phase 1 gate)
- No server API key exposure; wildcard CORS removed; WS proxy secured or disabled; 0777 perms removed; repo artifacts cleaned; token issuance gated; env validation in place; input validation enforced; local scripts resolve dependencies
Smoke/e2e
- Smoke (no external APIs):
  - Next headers test: curl with Origin: http://malicious-site.tld → 403/blocked; with Origin: http://localhost:3000 → 200
  - PHP CORS test similarly
  - WS proxy auth test: wscat attempt without auth fails; with mock token passes handshake
- E2E (mocked services):
  - Playwright test that loads app UI and stubs /api/realtime/token to return a fake client secret; UI proceeds without real OpenAI calls
Owners/Estimate/Risks/Rollback
- Owner: Security Eng + FE + BE; 1–2 days; risk: temporary feature disruption; rollback: revert specific diffs

Phase 2 — Build Discipline & CI
Objectives
- Ensure type-checking, linting, and basic security scans run on every change
Tasks
1) Fix TypeScript baseline
- Align typescript and @types/node versions to satisfy npx tsc --noEmit (TS1010 fix)
- Acceptance: tsc passes with no emit
2) CI pipeline
- Add GitHub Actions workflow to run: npm ci, npx tsc --noEmit, npm run lint, npm audit (moderate+)
- Optional: next build (if suitable for CI runtime) and cache node_modules
- Acceptance: CI passes on PR; fails on violations
3) Decide Sentry strategy
- Either initialize Sentry (sentry.client/server config) with DSN or remove Sentry deps and scripts
- Acceptance: Sentry either active and configured, or fully removed
4) Pin runtime and type baselines
- Pin Node engine in root package.json (e.g., "+engines.node >=18.17.0") and align @types/node to match; freeze minor versions for tooling if needed
- Acceptance: CI uses consistent Node version; type defs match runtime; fewer TS lib mismatches
5) Next API health endpoint (optional)
- Add simple health route for Next API to validate token route availability and headers in each env
- Acceptance: GET /api/health (or similar) returns 200 with version/time; used by uptime checks
Acceptance criteria (Phase 2 gate)
- CI green on main branch; tsc passes; lint passes; audit passes (no high/critical); engines pinned; optional Next health endpoint live
Smoke/e2e
- Smoke: local npx tsc --noEmit and npm run lint succeed; npm audit clean or accepted exceptions
- E2E (mocked): run minimal Playwright test suite gated on build passing
Owners/Estimate/Risks/Rollback
- Owner: Platform Eng; 1–2 days; low risk; rollback: revert CI config only

Phase 3 — Realtime Architecture Consolidation
Objectives
- Remove drift between multiple realtime paths; standardize contracts and message types; fix UI defects
Tasks
1) Standardize message protocol
- server/app.js currently expects {type: 'connect'}; websocket-server supports {type: 'connect_realtime'}
- Choose one (recommend: connect_realtime) and accept both temporarily; log metrics for migration
- Acceptance: Both servers accept the agreed type; clients updated; no mismatch
2) Dev rewrites correctness
- In next.config.mjs: keep dev-only rewrites but exempt /api/realtime/:path* and /api/voice/:path* so Next routes function in dev
- Acceptance: GET /api/realtime/token returns from Next in dev
3) Receptionist UI fix
- components/interfaces/receptionist-interface.tsx: replace undefined voiceState/voiceActions references (lines ~277–286) with realtimeState/realtimeActions or remove those controls if not relevant
- Acceptance: Component compiles and renders; basic UI flows operate with mocked responses
4) Choose a single realtime path
- Preferred: direct client-to-OpenAI via ephemeral client secrets from /api/realtime/token; deprecate unauthenticated WS proxy
- If proxy retained: enforce auth+limits and log usage
- Acceptance: One documented, secure path in use in app; deprecated path flagged
5) Realtime URL/config unification
- Normalize how clients discover WS/WebRTC endpoints: single source of truth via NEXT_PUBLIC_WEBSOCKET_URL (if WS retained) or rely solely on WebRTC client secrets; remove dead envs
- Acceptance: Hooks/components no longer require divergent URLs; defaults are sensible for dev/prod
6) Reconnect/backoff strategy
- Implement exponential backoff and capped retries for WS reconnects; for WebRTC, implement session restart on close/error with limits; add basic telemetry
- Acceptance: Transient disconnects recover automatically within bounds; logs confirm backoff
7) Remove/replace missing client module usage
- `lib/openai-client.js` is referenced by server/app.js and tests but absent; either restore a minimal client or refactor imports to use existing paths (WebRTC/WS client)
- Acceptance: No imports of missing modules; server/tests run without modification
8) Clerk dependency decision
- `@clerk/nextjs` present but unused; either wire providers/guards in layout/routes, or remove dependency
- Acceptance: No dead auth dependency; if enabled, basic auth flow documented and gated off by env in dev
Acceptance criteria (Phase 3 gate)
- No message-type mismatches; Next API reachable in dev; UI defect fixed; single sanctioned realtime path; unified config/URLs; reconnect logic in place; no missing-module imports; Clerk decision applied
Smoke/e2e
- Smoke: unit test for token route shape; WS contract test sends connect_realtime and verifies session update frame handling (mocked)
- E2E: Playwright navigates to receptionist/chatbot tiles; stubs network to assert UI behavior without hitting OpenAI/ElevenLabs
Owners/Estimate/Risks/Rollback
- Owner: FE + BE; 2–3 days; medium risk (feature wiring); rollback: feature-flag the new path

Phase 4 — Data Management & Privacy Posture
Objectives
- Reduce risk of PII exposure; prepare for DB migration while de-risking file-based storage
Tasks
1) Repo ignores & retention
- Ensure /data/** and /api/logs/** are git-ignored; add rotation/retention policy for logs; ensure chat_sessions/memory not committed
- Acceptance: git status clean; logs/data not tracked
2) Minimize PII in logs
- Scrub sensitive fields; add structured logging with event types
- Acceptance: sample logs show no PII beyond necessary metadata
3) (Optional) DB migration plan
- Design schema for users, chat_sessions, memory (Postgres); identify migration path; define DAL layer to abstract storage
- Acceptance: ADR (architecture decision record) captured with rollout plan; not mandatory to implement in this phase
4) Minimal DB pilot (recommended)
- Implement a small pilot (e.g., persist chat session metadata or voice event logs) to replace file writes in the hottest paths; add DAL abstraction and feature flag
- Acceptance: Selected flow writes to DB successfully in dev; file write contention reduced; easy fallback via flag
Acceptance criteria (Phase 4 gate)
- No tracked PII/data; logging minimal and structured; DB plan exists (if chosen); minimal DB pilot operational behind a flag
Smoke/e2e
- Smoke: grep repo for data/** and logs/**; verify .gitignore coverage
- E2E: None required; rely on lower-level tests
Owners/Estimate/Risks/Rollback
- Owner: BE; 2–4 days (including planning); low risk

Phase 5 — Performance & Caching
Objectives
- Reduce latency and cost of repeated calls; optimize heavy file I/O
Tasks
1) Response caching for idempotent calls
- Introduce in-memory (APCu) or Redis for PHP for marketing inbox and common prompts; cache keys by (messages hash, model)
- Acceptance: cache hit ratio measurable; fallback on cache miss
2) File I/O optimization
- Batch writes; avoid loading entire histories per request; lazy-load; stream large payloads; avoid writing response audio artifacts to disk
- Acceptance: temp response files no longer persist beyond request; reduced I/O operations per request
Acceptance criteria (Phase 5 gate)
- Caching layer in place for targeted endpoints; temp file cleanup confirmed; basic perf improvement measured (local bench)
Smoke/e2e
- Smoke: unit test cache manager; ensure behavior under cache miss/hit (mocked)
- E2E: Playwright can simulate flows with mock backend and timing budget (no real API calls)
Owners/Estimate/Risks/Rollback
- Owner: BE; 2–4 days; medium risk (cache coherency); rollback: toggle cache off via env

Phase 6 — Testing Program (Foundation & Ongoing)
Objectives
- Establish tests that do not rely on external API invocation; enforce progress gates through smoke/e2e at crucial steps
Tasks
1) Unit & integration foundation
- Add Vitest for unit; Supertest for API route testing (Next+PHP proxy layer via mock server); Testing Library for React components
- Acceptance: npm run test runs locally without external calls (network mocks)
2) E2E foundation with Playwright
- Add example flows: token issuance (mocked), receptionist/chatbot conversation (network intercepts), marketing/sales screen renders with mocked data
- Acceptance: npm run test:e2e passes locally and in CI; test duration < 3 min
3) Security & performance checks (lightweight)
- npm audit; optional semgrep; minimal perf smoke (budget-based assertions in UI)
- Acceptance: integrated into CI; fail gates in place
Suggested scripts (add to package.json)
- "test": "vitest"
- "test:e2e": "playwright test"
- "test:smoke": "vitest run --config tests/smoke.vitest.config.ts"
- "typecheck": "tsc --noEmit"
Acceptance criteria (Phase 6 gate)
- Tests run in CI with mocks; no external API invocation; smoke suite protects critical flows
Smoke/e2e
- This phase is the smoke/e2e layer; ensure added with stable selectors and network stubs
Owners/Estimate/Risks/Rollback
- Owner: QA/Eng; baseline in first week; low risk; rollback: disable flaky tests temporarily with quarantine tag

Phase 7 — Security Headers & Platform Hardening
Objectives
- Add defense-in-depth via standard security headers and policies
Tasks
1) Add security headers in Next
- X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS, and a CSP suitable for the app’s needs
- Acceptance: Headers present on /app routes and /api routes; CSP tuned
2) Review SMTP path
- Prefer PHPMailer path; if raw SMTP helper remains, add STARTTLS/cert validation and safer auth handling
- Acceptance: Outbound email path uses secure transport; fallbacks verified
Acceptance criteria (Phase 7 gate)
- Security headers delivered; email path secure or disabled
Smoke/e2e
- Smoke: curl -I checks for headers; unit test verifies helper configuration branches
Owners/Estimate/Risks/Rollback
- Owner: Platform/BE; 1–2 days; low risk; rollback: header changes revertible

Phase 8 — Documentation & Monitoring
Objectives
- Align docs with reality; enable observability
Tasks
1) Update repo docs
- WARP.md (already created), critical_audit.md (leave as record), add SECURITY.md (threat model + handling), and ADRs for realtime/data decisions
- Acceptance: Docs reflect current architecture and ops
2) Monitoring & alerting
- If Sentry chosen: confirm DSN and basic alerting; otherwise remove references; consider lightweight uptime pings for /api/health.php and Next health endpoints
- Acceptance: Basic monitoring documented or de-scoped
Smoke/e2e
- Smoke: Lint docs and verify links; health endpoint reachable locally
Owners/Estimate/Risks/Rollback
- Owner: Eng + PM; 1–2 days; minimal risk

Gating & Verification Matrix (per phase)
- Phase 1:
  - No Authorization secrets in any API response path
  - Disallowed Origin blocked; allowed Origin permitted
  - WS unauthenticated clients rejected
  - 0777 removed; .gitignore extended; artifacts removed
- Phase 2:
  - tsc passes; lint passes; CI green; Sentry decision enforced
- Phase 3:
  - Single realtime path; dev Next API functional; UI compiles
- Phase 4:
  - Data/logs ignored by git; logs scrubbed; DB plan recorded (optional)
- Phase 5:
  - Cache effectiveness visible in logs/metrics; no persistent temp output
- Phase 6:
  - Unit/integration/e2e smoke suites in CI, all mocked
- Phase 7:
  - Security headers present; SMTP secure
- Phase 8:
  - Docs aligned; monitoring decision implemented

\
\
Phased Plan Assessment — Comprehensive Analysis

Overall Assessment: EXCELLENT
- The plan is highly comprehensive, clear, and actionable, translating audit findings into an executable roadmap with crisp gates.

Strengths
- Comprehensive coverage: Addresses server secret exposure, CORS, WS proxy hardening, file permissions, repo hygiene, rewrites, protocol mismatch, UI defects, testing/CI, perf, and security headers.
- Excellent structure: Phased progression, detailed tasks, acceptance criteria, smoke/E2E gates, owner and risk/rollback sections.
- Actionable and measurable: Specific file paths, commands, configs, and verifiable outcomes.
- Traceability: Clear mapping to audit items and a verification matrix for each phase.

Minor Gaps Identified (now incorporated)
- Missing dependencies/module: Added tasks to restore/remove `lib/openai-client.js` usages and consolidate root deps (Phase 1.9, Phase 3.7).
- Environment variable validation: Added fail-fast checks (Phase 1.7).
- Realtime config/URL unification and reconnect/backoff: Added explicit tasks (Phase 3.5–3.6).
- Optional enhancements: Node engines pinned (Phase 2.4); minimal DB pilot (Phase 4.4).

Additional Recommendations
- Performance benchmarks: Add simple latency/error-budget targets to Phase 5 acceptance (e.g., 95th percentile response time improvements in local bench).
- Security scanning: Include `npm audit` in CI (already listed) and consider semgrep for PHP/TS (Phase 6 optional).

Final Verdict
- Approve with the incorporated enhancements. The plan provides a solid, production-ready remediation path aligned with the comprehensive audit and practical engineering workflows.

Traceability — Audit Items → Plan Tasks
- CORS wildcard (Next/PHP) → Phase 1.2
- PHP server secret exposure → Phase 1.1
- Unauth WS proxy → Phase 1.3 (or Phase 3.4 if consolidated later)
- 0777 mkdir → Phase 1.4
- Repo hygiene (donna-static, nested node_modules, data/logs) → Phase 1.5; Phase 4.1
- Token issuance gating → Phase 1.6
- TypeScript baseline fail → Phase 2.1
- CI missing → Phase 2.2
- Sentry not initialized → Phase 2.3
- Message-type mismatch (connect vs connect_realtime) → Phase 3.1
- Dev rewrites shadow Next routes in dev → Phase 3.2
- Receptionist UI undefined refs → Phase 3.3
- Data privacy/logging → Phase 4
- Caching/perf → Phase 5
- Security headers → Phase 7

Risks & Mitigations
- Breaking realtime while consolidating:
  - Mitigation: Feature-flag new path; keep old path until E2E passes
- CORS lockdown breaks integrations:
  - Mitigation: Staged allowlist rollout; observability on blocked Origins
- CI gates introduce friction:
  - Mitigation: Quarantine flaky tests; add gradual enforcement
- Cache inconsistencies:
  - Mitigation: Start with read-through cache on idempotent flows; add safe TTL; disable via env

Rollback Strategy
- Each phase changes isolated and PR’d separately; revert PR to roll back
- For runtime toggles: use env flags (e.g., ENABLE_WS_PROXY=false, ENABLE_CACHE=false)

Appendix — Example Testing Gates (Mocked)
- Unit (Vitest):
  - Token route returns shape { success: true, client_secret: '...' } with stubbed fetch
  - CORS helper returns 403 for disallowed Origin
- Integration (Supertest):
  - Next headers applied to /api/*; /api/realtime/token requires auth
- E2E (Playwright):
  - Intercept /api/realtime/token → return fixture; verify chat/receptionist flows render and progress without real calls

Appendix — Example CI Workflow (conceptual)
- jobs:
  - typecheck: npx tsc --noEmit
  - lint: npm run lint
  - test: npm run test (Vitest)
  - e2e: npm run test:e2e (with network intercepts)
  - audit: npm audit --audit-level=moderate

Notes
- Do not include server secrets in any client-facing response
- Treat any NEXT_PUBLIC_* values as public; never put secrets there
- Prefer ephemeral client secrets for OpenAI Realtime over proxying with server keys

