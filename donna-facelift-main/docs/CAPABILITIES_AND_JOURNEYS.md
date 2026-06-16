### Donna Capabilities & User Journeys

This document describes what the Donna system can do today, how users interact with it end‑to‑end, and how the platform is structured for security, observability, and extensibility.

---

## At a glance
- Hybrid platform: Next.js App Router + PHP endpoints, optional Node WebSocket proxy.
- Multimodal: voice (realtime), chat, and email (Gmail) flows.
- Security‑first: Clerk/JWT, CORS allowlist, rate limits, input validation, error hygiene.
- Observability: Sentry across browser, Next API, Node WS, and PHP.
- Data: Supabase for users, sessions, messages, email logs, Gmail tokens.
- Dev/ops: Node 20 LTS, E2E/unit tests, CI, deployment guides.

---

## User journeys

### 1) Voice Receptionist (Realtime)
- Start a voice session in the browser; audio is streamed to an OpenAI Realtime model.
- The assistant replies via synthesized audio; users control mic/VAD.
- Server issues a short‑lived client secret at `app/api/realtime/token/route.ts`.
- Voice events are logged; optionally fan‑out to PHP stubs for integrations.

Key pieces:
- Frontend: `components/voice/*`, `hooks/use-realtime-voice.ts`, `app/api/voice/events/route.ts`.
- Token: `app/api/realtime/token/route.ts` mints client secrets (dev/prod flows).
- Optional WS proxy: `websocket-server/` (JWT, origin allowlist, rate limits).
- Fan‑out to legacy stubs: `app/api/voice/fanout/route.ts` → `api/marketing.php`, `api/sales/overview.php`, `api/secretary/dashboard.php`.

What a user can do:
- Press mic to speak with Donna in realtime.
- Receive immediate spoken responses.
- (Optionally) turn on server VAD via proxy feature flags for hands‑free flow.

Trace:
- UI `VoiceControls` → hook `use-realtime-voice` → POST `/api/realtime/token` → OpenAI Realtime.
- Events POST `/api/voice/events` (rate‑limited) → optional fan‑out POST `/api/voice/fanout` → PHP stubs.


### 2) Chat Assistant
- Users type messages in UI; Donna responds.
- For authenticated users, chat sessions and messages are persisted to Supabase.
- Abuse detection flags risky content and logs it internally.

Key pieces:
- Frontend chat widget: `components/chat/ChatWidget.tsx`.
- Persistence: `app/api/db/chat/route.ts` (sessions/messages), `app/api/db/log/abuse/route.ts`.
- Security: Clerk auth, internal `API_SECRET` path for system logging, rate limit enforcement.

What a user can do:
- Have multi‑turn text conversations.
- See history maintained per session (signed‑in users).

Trace:
- UI `components/chat/ChatWidget.tsx` (text or mic) → realtime/send or PHP `donna_logic.php` (batch).
- Persistence via POST `/api/db/chat` (auth or internal secret); abuse logs via POST `/api/db/log/abuse`.


### 3) Gmail Assistant
- Connect Gmail via OAuth; store refresh tokens in Supabase per user.
- List recent messages.
- Draft a human‑like reply to a selected message (LLM summarization + drafting).
- Send emails using Gmail API; log successes/errors.
- Autopilot mode (cron‑style) replies to unread messages within configured caps.

Key pieces:
- OAuth connect/callback: `app/api/gmail/oauth/start/*`, `app/api/gmail/oauth/callback/route.ts`.
- List messages: `app/api/gmail/messages/route.ts`.
- Draft reply: `app/api/gmail/draft-reply/route.ts`.
- Send email: `app/api/gmail/send/route.ts`.
- Autopilot: `app/api/gmail/autopilot-run/route.ts`.
- DB tables: `users`, `gmail_tokens`, `email_logs`.

What a user can do:
- Connect inbox, fetch recent threads, generate drafts, and send.
- Enable autopilot to handle routine replies.

Trace:
- Connect: GET `/api/gmail/oauth/start` → Google → GET `/api/gmail/oauth/callback` (stores refresh token).
- List: GET `/api/gmail/messages`. Draft: POST `/api/gmail/draft-reply`. Send: POST `/api/gmail/send` (+ `/api/db/log/email`).
- Autopilot: GET `/api/gmail/autopilot-run` (cron‑style), rate‑limited by Gmail APIs.


### 4) UI Interfaces (Dashboards)
- Secretary, Sales, Marketing, Campaigns, Analytics pages demonstrate how the assistant integrates with business workflows.
- These pages are scaffolds with fan‑out hooks you can wire to real data stores/services.

Key pieces:
- UI: `components/interfaces/*`, pages under `app/*/page.tsx`.
- Fan‑out: `app/api/voice/fanout/route.ts` → PHP stubs to simulate backend actions.

What a user can do:
- Navigate domain‑oriented pages, see status tiles, initiate demo actions.

---

## Capabilities by layer

### Frontend (Next.js 14 App Router)
- Pages under `app/` (mix of server/client components).
- Shared UI via `components/ui/*` (shadcn/ui) and domain interfaces under `components/interfaces/*`.
- Voice components and hooks under `components/voice/*` and `hooks/*`.
- TypeScript path alias `@/*` covers the repo root.

### Next.js API routes (`app/api/*`)
- Health: `app/api/health/route.ts` (public, minimal info, sampled Sentry).
- Realtime token: `app/api/realtime/token/route.ts` (dev: simplified; prod: auth + rate limit + client secret minting).
- Voice events/fanout: `app/api/voice/events/route.ts`, `app/api/voice/fanout/route.ts`.
- Gmail: `oauth/*`, `messages`, `draft-reply`, `send`, `autopilot-run`.
- Persistence logging: `db/chat`, `db/log/abuse`, `db/log/email`.
  - Shared CORS helpers: `lib/cors.ts` used by token/voice routes for dynamic ACAO/credentials on POST and OPTIONS.

### PHP endpoints (`api/*`)
- Legacy/compatibility logic, voice batch path, marketing/sales/secretary stubs.
- Security middleware (CORS, rate limit) loaded via `bootstrap_env.php`.
- Sentry PHP handler auto‑registers when DSN is present.
- Key files: `api/voice-chat.php`, `api/realtime-websocket.php` (docs + proxy info), `api/inbox.php` (legacy inbox/Gmail path), `api/lib/*` (helpers: CORS, rate limiter, response cache, SMTP/PHPMailer), and stubs under `api/sales/*`, `api/secretary/*`.

### Optional Node WebSocket proxy (`websocket-server/`)
- Secure WS proxy for OpenAI Realtime when browser‑direct WebRTC is not feasible.
- Capabilities: origin allowlist, JWT auth, rate limiting, connection limits, Sentry instrumentation (request/error middlewares + process handlers).

### Data (Supabase)
- Tables (expected): `users`, `chat_sessions`, `messages`, `email_logs`, `gmail_tokens`, plus domain tables you add.
- Admin client in `lib/supabase-admin.ts` used by server routes.

---

## Security
- Auth: Clerk JWT for user routes; internal `API_SECRET` path for system logging and fan‑out.
- CORS: allowlist enforced (Next + PHP). `Vary: Origin`, credentials only for matched origins.
- Rate limits: token issuance, voice endpoints, PHP endpoints.
- Input validation: server‑side validation via `lib/input-validation.ts` (`COMMON_SCHEMAS`); add Zod where stricter types are needed.
- Error hygiene: client responses don’t leak internals; Sentry/logs capture details.
- Email safety: header sanitization; Gmail base64url correctness in send/receive paths.

Feature flags:
- `ENABLE_API_SECURITY` (prod recommended), `ALLOWED_ORIGINS` (comma‑separated), `AUTH_DISABLE_CLERK` (dev only), `ENABLE_WS_PROXY` (WS proxy).

---

## Observability
- Sentry across:
  - Client: `app/global-error.tsx` (fingerprint + context).
  - Next API routes: capture exceptions and tag trace IDs.
  - Node WS proxy: request/error middlewares; unhandled rejection/exception.
  - PHP: global error/exception/shutdown handler registered when DSN present.
- Health endpoint sampling to avoid noise.

Set:
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, CI sourcemaps optional with `@sentry/cli`.

---

## Configuration & environments
- Dev
  - Node 20 LTS (pinned via `.nvmrc`/`engines`), permissive CORS for localhost, Clerk bypass optional.
  - WebRTC (browser‑direct) by default; WS proxy off by default.
- Prod
  - Strict CORS allowlist; Clerk auth; 5‑minute token TTL recommended.
  - `ENABLE_API_SECURITY=true`, rate limits enabled.

See: `docs/ENVIRONMENT_CONFIG.md` and `docs/ENV_CONFIG_EXAMPLES.md`.

---

## Testing & CI
- Unit: Jest (`npm test`) with targeted coverage.
- E2E: Playwright smoke (`npm run test:e2e:smoke`) auto‑builds/starts the app; base URL/port configurable via `E2E_PORT`/`BASE_URL`.
- WS contract: `npm run test:ws2:all`.
- Security smoke: `npm run test:security:smoke`.
- PHP schema checks: `npm run test:php-schemas`.
- CI: `.github/workflows/ci.yml` with `workflow_dispatch`.

---

## Deployment
- Next.js on Vercel/Node 20 (`npm run build` then `npm run start`); standalone output is available if you opt for self‑hosting.
- Node WS proxy deployed separately if used.
- PHP deployed with `.env` outside web root; `bootstrap_env.php` loads env, rate limiter, and Sentry handler.
- Node 20 LTS recommended.

---

## Extensibility
- Replace PHP stubs with real services (CRM, analytics, campaign engines).
- Extend Supabase schema for leads, contacts, actions; wire UI interfaces to queries/views.
- Enhance autopilot with backoff, quotas, and human‑in‑the‑loop review.
- Add tool invocation (calendar, CRM) as Realtime “tools” when desired.

---

## Quickstart scenarios

### Voice concierge
1) Set `OPENAI_API_KEY`, `ALLOWED_ORIGINS`, enable security for prod.
2) `npm run dev` and open the voice UI.
3) Backend issues token; Realtime session starts; responses stream back as audio.

### Gmail assistant
1) Configure Google OAuth (client/secret/redirect) and Supabase.
2) Connect Gmail, list messages, draft a reply, send.
3) Check `email_logs` for results; enable autopilot with a cron hitting `autopilot-run`.

### Chat with persistence
1) Sign in via Clerk; open chat UI.
2) Send messages; server stores them under your `chat_sessions`/`messages`.
3) Review logs and Sentry events for errors.

---

## Endpoint map (selected)
- Voice
  - `POST /api/realtime/token` – mint client secret for OpenAI Realtime.
  - `POST /api/voice/events` – log/forward voice events.
  - `POST /api/voice/fanout` – call PHP stubs for demo side effects.
- Gmail
  - `GET /api/gmail/oauth/start`, `GET /api/gmail/oauth/callback` – connect.
  - `GET /api/gmail/messages` – list messages.
  - `POST /api/gmail/draft-reply` – draft with LLM.
  - `POST /api/gmail/send` – send via Gmail API.
  - `GET /api/gmail/autopilot-run` – cron‑style batch.
- Persistence & logs
  - `POST /api/db/chat` – persist chat (auth or internal secret).
  - `POST /api/db/log/abuse` – abuse logging (internal secret).
  - `POST /api/db/log/email` – email logs (internal secret).
- Health
  - `GET /api/health` – app status (scrubbed).

---

## Production guardrails
- Set `ALLOWED_ORIGINS` strictly; no wildcards.
- Enable Clerk auth; disable dev bypass.
- Enforce token TTL (~5 minutes) and rate limits on sensitive endpoints.
- Keep secrets server‑only; never return server API keys to clients.
- Prefer PHPMailer to bespoke SMTP; if using raw SMTP, require STARTTLS.
- Capture but avoid leaking errors; Sentry carries details.

---

## Where to go next
- Wire dashboards to real data; replace PHP stubs with your services.
- Expand Supabase schema/types for leads, CRM, analytics.
- Add function calling/tools to the Realtime session for calendar/CRM automations.
- Tighten CI checks for e2e/security tests before releases.
