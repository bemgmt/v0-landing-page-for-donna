# Surfaced Issues — Cross-Workstream Verification

Date: 2025-09-09
Scope: Audit of MVP/updates.md claims vs repository state; include critical gaps not claimed but currently wrong or unsafe.

Sources reviewed
- MVP/updates.md
- MVP/workstreams.md (for ownership/checkpoints)
- Key code paths: next.config.mjs, hooks/use-openai-realtime.ts, components/*, websocket-server/server.js, server/app.js, app/api/realtime/token/route.ts, PHP api/* and lib/* files.

---

WS2 — Realtime & Voice Architecture (Owner: CODEX)

1) Default path NOT flipped to WebRTC (contradicts Updates)
- Claim (Updates): “Default path flip: Switched default to WebRTC by setting NEXT_PUBLIC_USE_WS_PROXY default to false in the hook.”
- Evidence: hooks/use-openai-realtime.ts still defaults to using the proxy.
  - Line ~235: const useWsProxy = (process.env.NEXT_PUBLIC_USE_WS_PROXY || 'true') === 'true'
  - Default remains 'true' => WebSocket Proxy is used by default.
- Impact: Keeps the less secure proxy as default, contrary to plan to prefer token-based direct realtime.
- Fix: Change default to 'false' or surface a visible UI/env gate and ensure docs reflect this.

2) “Single sanctioned path enforced (token-based)” is not enforced
- Claim (Updates): Phase 3 checkpoints satisfied including “Single sanctioned path enforced (token‑based), proxy behind flag”.
- Evidence: Both paths remain active; the proxy is still default (see Issue #1). No enforcement mechanism observed.
- Impact: Dual-path drift; security hardening (token-only path) not actually in effect.
- Fix: Enforce token-based path unless an explicit feature flag enables proxy; default flag OFF.

3) Legacy removal claim inconsistent — legacy ‘connect’ still supported
- Claim (Updates): “Legacy removal: Dropped legacy WS message types (`connect`, ...).”
- Evidence: server/app.js still handles 'connect' with a deprecation note and fallthrough to connect_realtime.
  - server/app.js lines ~168–172 include 'connect' and 'connect_realtime'.
- Impact: Minor; can keep for migration, but the update overstates removal.
- Fix: Either remove legacy immediately or align updates.md to say it’s retained with deprecation.

4) Missing “PHP-only” rewrite claimed in Updates
- Claim (Updates): “Added narrow dev rewrite { source: '/api/:path*.php', destination: 'http://localhost/donna/api/:path*.php' }.”
- Evidence: next.config.mjs rewrites only:
  - '/donna/api/:path*' and '/php/:path*'. No '/api/:path*.php' rule present (lines ~31–34).
- Impact: Dev calls to /api/*.php may not proxy as claimed.
- Fix: Add the exact rewrite if still desired, or update the log to reflect actual rewrites.

5) VAD state mismatch with Updates log
- Claim (Updates): “VAD enabled: turn_detection: { type: 'server_vad' } ... Auto‑response on VAD stop wired.”
- Current State: VAD now default OFF by design (push‑to‑talk primary) with env flags to re-enable.
  - websocket-server/server.js: ENABLE_SERVER_VAD default false; turn_detection only set when enabled.
  - hooks/use-openai-realtime.ts: explicit response.create on stopListening to preserve turn-taking without VAD.
- Impact: Updates are stale; team could be confused about expected behavior.
- Fix: Update WS2 notes to reflect VAD default OFF and the env gates to re-enable.

6) Proxy still bridges with server API key by default
- Not a new claim, but contradicts “prefer client‑secret + direct Realtime; proxy optional behind a flag.”
- Evidence: websocket-server/server.js connects to wss://api.openai.com with Authorization: Bearer process.env.OPENAI_API_KEY (lines ~285–292) and the client default path still hits the proxy.
- Impact: Increased abuse/credential risk if deployed broadly.
- Fix: Flip default to direct WebRTC (Issue #1) and/or require auth for proxy usage; restrict ALLOWED_ORIGINS.

---

WS3 — Build, CI & Quality Gates (Owner: CURSOR)

7) “WebSocket server testing” step is present but can be a no‑op
- Claim (Updates): Pipeline includes “WebSocket server testing”.
- Evidence: .github/workflows/ci.yml uses “npm test || echo 'No tests defined yet'” under websocket-server.
  - Lines ~49–51; step passes even if no tests exist.
- Impact: Overstated coverage; may hide regressions in WS server without tests.
- Fix: Add at least one smoke test or remove the fallback echo to ensure failure when missing.

8) Production build still ignores TS/ESLint errors
- Evidence: next.config.mjs has:
  - eslint.ignoreDuringBuilds: true; typescript.ignoreBuildErrors: true (lines ~3–8).
- Impact: Outside CI, 'npm run build' may succeed with type/lint errors; footgun for ad‑hoc builds.
- Fix: Consider removing these ignores once CI gates are stable; at minimum, document the risk.

(Other WS3 claims like health endpoint, engines pinning, TS zero errors, CI gates appear consistent with files present.)

---

WS4 — Data Management, Logging & Error Handling (Owner: AUGMENT)

9) Updates inconsistency: Phase 4 completion counts contradict task statuses
- Claim (Updates): Tasks 4.1, 4.2, 4.5, 4.3, 4.4 marked COMPLETED ✅.
- Later in same section: “Phase 4 Data/Privacy Gate: 2/5 tasks completed; Next: 4.5, 4.3, 4.4”.
- Impact: Confusing status; hard to track done vs next.
- Fix: Reconcile the counts and “Next” list to match actual completion.

10) 0777 directory permissions still used for runtime data (security risk)
- Evidence: api/donna_logic.php creates directories with 0777 (world-writable).
  - Lines ~144–148: mkdir($dir, 0777, true)
- Impact: High security concern on shared hosts; contradicts hardening goals.
- Fix: Use 0755/0700 and verify umask; ensure safe ownership.

11) Standardized error responses adopted in some endpoints but not consistently guaranteed
- Evidence: api/health.php uses ErrorResponse::success(); api/donna_logic.php uses ErrorResponse on config error; others may still emit ad‑hoc JSON.
- Impact: Inconsistent client error shape across endpoints until fully migrated.
- Fix: Track endpoint coverage and migrate remaining responses.

---

Cross‑cutting security gaps (Not necessarily claimed done but currently wrong/unsafe)

12) [RESOLVED] Next.js API wildcard CORS
- Previous: next.config.mjs injected wildcard CORS for /api/*.
- Now: Wildcard headers removed from next.config.mjs; allowlist enforced via middleware.ts (OPTIONS + runtime checks). Set ALLOWED_ORIGINS/PRODUCTION_DOMAIN.

13) [RESOLVED] Token endpoint (/api/realtime/token) lacked auth gating
- Previous: No auth/origin validation on token issuance.
- Now: app/api/realtime/token/route.ts requires auth (Clerk session or JWT fallback), validates Origin, rate limits issuance, validates inputs, and sets security headers.

---

Suggested next actions
- WS2 (CODEX):
  - Flip NEXT_PUBLIC_USE_WS_PROXY default to 'false'; update docs to reflect WebRTC as default; keep proxy behind explicit flag.
  - Either remove or clearly document continued legacy 'connect' support.
  - Add missing '/api/:path*.php' dev rewrite if still required, or correct the update note.
  - Update WS2 VAD notes to reflect default OFF state and env gates.
- WS3 (CURSOR):
  - Add a minimal websocket-server test (smoke/connect) so CI fails if behavior regresses.
  - Consider removing ignoreDuringBuilds / ignoreBuildErrors when CI is stable.
- WS4 (AUGMENT):
  - Fix mkdir perms (0777 -> 0755/0700) and audit other file ops.
  - Reconcile Updates status counts and ensure standardized error response coverage list.
- WS1 (CLAUDE):
  - Tighten CORS for Next APIs; add auth/origin checks to token endpoint; consider feature‑flagging or deprecating the proxy in prod.

Notes
- Items labeled “Claim mismatch” specifically contradict Updates or present logs; others are critical gaps currently observed irrespective of claims.

