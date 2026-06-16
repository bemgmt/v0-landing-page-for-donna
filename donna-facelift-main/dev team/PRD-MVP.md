# DONNA MVP PRD (v0.2)

## Purpose & Scope

Deliver a reliable MVP of the DONNA platform with:
- Text chat and real-time voice (OpenAI Realtime via WebRTC)
- Gmail API OAuth integration (list messages, send email)
- Database migration to Supabase (Postgres) for core entities
- Full authentication with Clerk/JWT across frontend and backend
- Security hardening (CORS, rate limiting) and documentation cleanup

Out of scope for MVP: advanced analytics/APM and complex CRM features (pipelines, multi-tenant reporting, forecasting). These remain post-MVP.

## Success Criteria

- Text chat works end-to-end via `POST /api/donna_logic.php` (or Next.js proxy), and persists to Supabase.
- Real-time voice works using WebRTC client secret flow with OpenAI Realtime.
- Gmail API: OAuth flow completes, tokens stored in Supabase, inbox listing and sending email work.
- Clerk/JWT auth enforces access in Next.js and is validated in PHP endpoints.
- Architecture docs reflect current implementation; no garbled characters.
- Environments documented and reproducible with `.env`.

## Key User Stories

- As a user, I can chat with DONNA and see conversation history preserved.
- As a user, I can talk to DONNA in real time and hear responses quickly.
- As a marketing/sales user, I can connect Gmail (OAuth), view a small inbox list, and send an email via Gmail API.
- As an operator, I can deploy the stack and verify health endpoints.

## System Overview (MVP)

- Frontend (Next.js): `app/`, `components/`, `hooks/`, `lib/`
- PHP API: `api/` (text chat, marketing compatibility shim, sales/secretary stubs)
- Real-Time Voice: WebRTC via `app/api/realtime/token/route.ts` + `lib/realtime-webrtc.ts`
- Database: Supabase (Postgres) for users, sessions, messages, memory, logs, gmail tokens
- Auth: Clerk (Next.js) with JWT verification for PHP endpoints
- Email: Gmail API for inbox/send; SMTP/PHPMailer remains fallback for specific cases

## Parallel Workstreams (MVP Delivery Plan)

To deliver fastest, execution splits into three parallel workstreams with clear owners, interfaces, and acceptance.

- Workstream A: Platform & PHP Glue (Owner: Codex CLI)
  - Scope: PHP auth/JWT + CORS, rate limiting, legacy API shims, environment consistency, docs/encoding hygiene.
  - Deliverables:
    - `api/_auth.php` with Clerk RS256 JWT verification + `API_SECRET` fallback and CORS headers.
    - `api/_rate_limit.php` and usage in critical endpoints (e.g., `donna_logic.php`).
    - Updated PHP endpoints to require auth helper and respect CORS/options.
    - `.env.example` consolidation for security variables; doc updates in `architecture/*`.
  - Interfaces:
    - Calls to Next.js routes from Workstream B via `Authorization: Bearer <API_SECRET>`.
    - Exposes `POST /api/donna_logic.php` response shape consumed by frontend (Workstream C).
  - Exit Criteria & Contracts (WS-A):
    - All PHP endpoints include `_auth.php`; CORS preflight (`OPTIONS`) returns `204` and proper headers.
    - Auth accepts either valid Clerk JWT (RS256 via JWKS) or internal `API_SECRET`. Invalid requests return JSON 401.
    - Rate limiting via `_rate_limit.php` applied to `donna_logic.php` and other critical endpoints; 429 returns JSON error.
    - `api/health.php` responds with JSON `{ ok: true, service: 'donna-api', version, time }` when authorized.
    - Response contract for `POST /api/donna_logic.php` (consumed by frontend):
      ```json
      {
        "success": true,
        "reply": "string",
        "action": "chat" | "send_message" | "email_sent" | "email_error" | "classify_lead" | "start_campaign" | null,
        "metadata": {
          "profile": "general" | "sales" | "receptionist" | "marketing",
          "abuse_detected": false,
          "chat_id": "string",
          "authenticated": true
        }
      }
      ```

- Workstream B: Data, Integrations & Telemetry (Owner: Augment GPT-5 w/ Supabase + Sentry)
  - Scope: Supabase schema + clients, server routes for persistence, Gmail OAuth/messages/send, Sentry instrumentation.
  - Deliverables:
    - SQL schema applied; `lib/supabase.ts` (client) and `lib/supabase-admin.ts` (server).
    - `app/api/db/chat/route.ts` for persisting sessions/messages/logs.
    - `app/api/gmail/*` routes: `oauth/start`, `oauth/callback`, `messages`, `send` with token storage in `gmail_tokens`.
    - Sentry setup for Next.js (client/server/edge) and route handlers; error capture around external calls.
  - Interfaces:
    - Accepts `API_SECRET` internal auth from Workstream A and session auth from Workstream C.
    - Provides typed response contracts used by Workstream C UI.

- Workstream C: Frontend & Realtime UX (Owner: Gemini CLI)
  - Scope: Clerk app integration, protected routes/middleware, chat UI with persistence, Gmail connect + inbox + send UI, WebRTC controls.
  - Deliverables:
    - `app/layout.tsx` wrapped with Clerk, `middleware.ts` protecting routes.
    - Minimal chat UI that persists via Workstream B endpoints; uses `chat_id`/session.
    - Gmail connect button (OAuth start), inbox list (max 5), send email composer wired to B routes.
    - WebRTC start/stop control using existing `lib/realtime-webrtc.ts` and token route.
  - Interfaces:
    - Uses Clerk session; consumes Workstream B APIs; displays errors captured by Sentry.

Dependencies & Inputs
- Credentials and values are provided by the user in `needed_from_user.md` (Clerk, Supabase, Google/Gmail, OpenAI, Sentry, optional SMTP/ElevenLabs).
- Workstreams B and C are blocked on these credentials; Workstream A can proceed with stubs and `API_SECRET`.

Handoffs
- B publishes route schemas (request/response examples) that A and C rely on.
- C confirms UI flows and acceptance tests against B endpoints; A validates PHP <-> Next internal calls.

## Prioritized MVP Work (What to Build/Fix First)

1) Auth: Clerk/JWT + CORS tightening (Next.js + PHP)
- Integrate Clerk in Next.js; protect routes and API routes; validate JWT in PHP.
- Restrict CORS to configured origins.

2) Database: Supabase migration and persistence
- Create tables and wire persistence for chat/messages/memory/abuse/email logs; store Gmail tokens.

3) Gmail API Integration
- OAuth start/callback; store tokens; list inbox; send email.
- Update marketing path to call Next.js Gmail endpoints (deprecate direct SMTP for marketing).

4) Real-Time Voice via WebRTC
- Maintain existing WebRTC path, wire basic UI to start/stop session.

5) Docs & Encoding Hygiene
- Replace garbled characters in architecture docs and console logs; reflect Gmail/Supabase/Clerk.

6) Rate Limiting (Basic)
- Lightweight IP-based rate limiting in PHP for key endpoints.

7) Environment Consistency
- Update `.env.example` for MVP variables; mark legacy/optional vars separately.

## Detailed Requirements & Implementation Plan

### 1. Auth: Clerk/JWT + CORS Tightening

- Goals:
  - Use Clerk for user auth (Next.js). Propagate identity to backend via JWT.
  - PHP endpoints verify Clerk JWT (RS256) via JWKS; fallback to internal `API_SECRET` for service-to-service calls.
  - Allow only configured origins via CORS.

- Env variables (add to `.env` and `.env.example`):
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...`
  - `CLERK_SECRET_KEY=...`
  - `CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json`
  - `API_SECRET=change_me` (fallback for internal calls)
  - `ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.vercel.app`

- Next.js (frontend):
  - Install Clerk and wrap app: `app/layout.tsx`
  - Protect pages: sales/marketing/secretary routes require auth.
  - Middleware: add `middleware.ts` to protect app routes.

Example `app/layout.tsx`:
```
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en"><body>{children}</body></html>
    </ClerkProvider>
  )
}
```

- Next.js (API routes):
  - Use `@clerk/nextjs` server helpers to read user in API handlers and forward authorized calls to PHP if needed.

Example in route handler:
```
import { auth } from '@clerk/nextjs'

export async function GET() {
  const { userId } = auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  // ...
}
```

- PHP auth helper: `api/_auth.php`
  - Verify Clerk JWT against `CLERK_JWKS_URL` (cache JWKS on disk for 5-15 min).
  - Accept RS256, check `iss`, `aud`, expiry, and `sub`/`sid`.
  - Fallback: accept `Authorization: Bearer <API_SECRET>` for internal calls.

Example skeleton `api/_auth.php`:
```
<?php
require_once __DIR__ . '/../bootstrap_env.php';

function donna_send_unauthorized($msg = 'Unauthorized') {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => $msg]);
  exit;
}

function donna_cors_and_auth(): array {
  // CORS
  $allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '*')));
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $originAllowed = in_array('*', $allowed, true) || ($origin && in_array($origin, $allowed, true));
  header('Access-Control-Allow-Origin: ' . ($originAllowed ? ($origin ?: '*') : ($allowed[0] ?? '*')));
  header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

  // Auth: API_SECRET fallback
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (stripos($auth, 'Bearer ') === 0) {
    $token = trim(substr($auth, 7));
    if ($token && $token === (getenv('API_SECRET') ?: '')) return ['auth' => 'internal'];
  }

  // Auth: Clerk JWT (RS256)
  $jwt = null;
  if (stripos($auth, 'Bearer ') === 0) { $jwt = trim(substr($auth, 7)); }
  if (!$jwt) donna_send_unauthorized();

  // Minimal JWT verification: header decode -> kid -> fetch JWKS -> verify (use firebase/php-jwt in prod)
  // For PRD, specify requirement to install composer deps outside webroot and include autoload.
  // composer require firebase/php-jwt
  if (!class_exists('Firebase\\JWT\\JWT')) {
    donna_send_unauthorized('JWT library missing');
  }
  $jwksUrl = getenv('CLERK_JWKS_URL');
  $jwks = json_decode(@file_get_contents($jwksUrl), true);
  if (!$jwks || empty($jwks['keys'])) donna_send_unauthorized('JWKS fetch failed');
  // ... find matching key by kid and verify RS256 signature ...
  // On success, return user claims
  return ['auth' => 'clerk', 'sub' => 'user_id'];
}
```

- Usage in PHP endpoints (top of each file after headers):
```
require_once __DIR__ . '/_auth.php';
$auth = donna_cors_and_auth();
```

### 2. Database: Supabase Migration and Persistence

- Goals:
  - Store users, chat sessions, messages, user memory, abuse log, email log, and Gmail OAuth tokens in Supabase.
  - Use `@supabase/supabase-js` in Next.js for server-side operations. For PHP, fan out to Next.js server routes or Supabase REST when needed.

- Env variables:
  - `SUPABASE_URL=https://...supabase.co`
  - `SUPABASE_ANON_KEY=...` (client-side allowed)
  - `SUPABASE_SERVICE_ROLE_KEY=...` (server-only)

- Schema (SQL):
```
-- users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  created_at timestamptz default now()
);

-- chat_sessions
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  chat_id text unique,
  created_at timestamptz default now()
);

-- messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text check (role in ('system','user','assistant')),
  content text,
  created_at timestamptz default now()
);

-- user_memory
create table if not exists user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  key text,
  value jsonb,
  updated_at timestamptz default now()
);

-- abuse_log
create table if not exists abuse_log (
  id bigserial primary key,
  chat_id text,
  user_id uuid references users(id) on delete set null,
  message text,
  created_at timestamptz default now()
);

-- email_logs
create table if not exists email_logs (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  to_address text,
  subject text,
  status text,
  error text,
  created_at timestamptz default now()
);

-- gmail_tokens (store refresh tokens server-side only)
create table if not exists gmail_tokens (
  user_id uuid primary key references users(id) on delete cascade,
  refresh_token text not null,
  scope text,
  token_type text,
  expiry_date bigint,
  updated_at timestamptz default now()
);
```

- Next.js Supabase clients:
```
// lib/supabase.ts (client)
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// lib/supabase-admin.ts (server)
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
```

- Persist chat in Next.js via a server route, called from PHP after response or by frontend directly.

Example route: `app/api/db/chat/route.ts` (server-only):
```
import { supabaseAdmin } from '@/lib/supabase-admin'
import { auth } from '@clerk/nextjs'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const body = await req.json()
  // upsert user and insert session/messages...
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

- PHP can optionally `POST` to the above with `API_SECRET` for legacy flows.

### 3. Gmail API Integration

- Goals:
  - Implement OAuth flow, store tokens in Supabase, provide inbox list and send endpoints.
  - Prefer Next.js routes using `googleapis` (Node). PHP `api/marketing.php` becomes a thin proxy or is deprecated in favor of Next routes.

- Env variables:
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`
  - `GOOGLE_REDIRECT_URI=https://<host>/api/gmail/oauth/callback`
  - Scopes (fixed in code): `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`

- Routes (Next.js):
  - `app/api/gmail/oauth/start/route.ts` -> redirect user to Google OAuth
  - `app/api/gmail/oauth/callback/route.ts` -> exchange code, save tokens (Supabase)
  - `app/api/gmail/messages/route.ts` -> list latest messages (authorized user)
  - `app/api/gmail/send/route.ts` -> send email via Gmail API

Example `oauth/start/route.ts`:
```
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent'
  })
  return NextResponse.redirect(url)
}
```

Example `oauth/callback/route.ts` (save tokens):
```
import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { auth } from '@clerk/nextjs'

export async function GET(req: Request) {
  const { userId } = auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
  const { tokens } = await oauth2.getToken(code!)
  // upsert users row by clerk_id then insert into gmail_tokens
  return new Response('Connected. You can close this window.', { status: 200 })
}
```

Example `messages/route.ts`:
```
import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { auth } from '@clerk/nextjs'

export async function GET() {
  const { userId } = auth(); if (!userId) return new Response('Unauthorized', { status: 401 })
  // load tokens for userId from Supabase, set credentials
  const gmail = google.gmail({ version: 'v1', auth: /* oauth2 client */ })
  const list = await gmail.users.messages.list({ userId: 'me', maxResults: 5 })
  return new Response(JSON.stringify(list.data), { status: 200 })
}
```

Example `send/route.ts`:
```
// Create RFC 5322 message and base64url encode, then gmail.users.messages.send
```

- Backwards compatibility: `api/marketing.php`
  - Either deprecate or proxy to Next.js `api/gmail/messages` and `api/gmail/send` with `Authorization: Bearer <API_SECRET>`.

### 4. Real-Time Voice via WebRTC (Primary Path)

- Keep existing:
  - Token route: `app/api/realtime/token/route.ts`
  - Client: `lib/realtime-webrtc.ts`
  - UI: simple control to start/stop session and send text.

### 5. Docs & Encoding Hygiene

- Replace non-ASCII/garbled characters in `architecture/*.md` and console logs in Node/TS.
- Update docs to reflect Gmail API, Supabase, Clerk/JWT, and the WebRTC flow.

### 6. Basic Rate Limiting (PHP)

- Helper: `api/_rate_limit.php` (flat-file, IP-based)
```
<?php
function donna_rate_limit(string $bucket, int $limit, int $windowSec = 60): void {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $key = $bucket . '_' . preg_replace('/[^a-z0-9_.:-]/i', '_', $ip);
  $dir = __DIR__ . '/../data/rate'; if (!is_dir($dir)) { @mkdir($dir, 0777, true); }
  $path = $dir . '/' . $key . '.json';
  $now = time(); $data = ['start' => $now, 'count' => 0];
  if (is_file($path)) { $data = json_decode(@file_get_contents($path), true) ?: $data; }
  if ($now - ($data['start'] ?? 0) >= $windowSec) { $data = ['start' => $now, 'count' => 0]; }
  $data['count'] = ($data['count'] ?? 0) + 1; file_put_contents($path, json_encode($data));
  if ($data['count'] > $limit) { http_response_code(429); echo json_encode(['success'=>false,'error'=>'Rate limit exceeded']); exit; }
}
```

### 7. Environment Consistency

Add/ensure in `.env.example`:
```
# Security / CORS
API_SECRET=change_me
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.vercel.app

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Gmail OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/oauth/callback

# OpenAI / Realtime
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17

# ElevenLabs (optional, batch voice)
ELEVENLABS_API_KEY=...

# SMTP fallback (optional)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your_email@gmail.com
EMAIL_SMTP_PASS=your_app_password
EMAIL_SMTP_SECURE=tls
EMAIL_FROM=no-reply@yourdomain.com
EMAIL_FROM_NAME=DONNA

# (Optional/Legacy) Octoparse/DB variables below are not used in MVP
```

## Acceptance Test Plan

- Auth/CORS:
  - Access protected Next.js pages shows login; API routes return 401 without session.
  - PHP endpoints accept valid Clerk JWT or internal secret; invalid requests 401.

- Text Chat + Persistence:
  - `POST /api/donna_logic.php` returns JSON with `reply` and `action`.
  - Session and messages appear in Supabase tables; user row is upserted by `clerk_id`.

- Gmail:
  - Visit `/api/gmail/oauth/start` -> consent -> callback stores tokens in Supabase.
  - `GET /api/gmail/messages` returns latest messages (limit 5).
  - `POST /api/gmail/send` sends email; record saved in `email_logs`.

- Realtime (WebRTC):
  - `POST /api/realtime/token` returns `{ client_secret: { value: ... } }`.
  - Start session from UI: session connects, streaming works.

- Rate Limiting:
  - Exceed threshold on `donna_logic.php` -> 429.

- Docs:
  - Open `architecture/*.md` and confirm trees render clean ASCII; Gmail/Supabase/Clerk accurately described.

## Deployment Guide (MVP)

- Frontend (Next.js): Vercel or Node host
  - Paths: `app/`, `components/`, `hooks/`, `lib/`
  - Env: OpenAI/Clerk/Supabase/Google; optional ElevenLabs.
  - Verify: site opens; Clerk login; `/api/realtime/token`,`/api/gmail/oauth/start`.

- PHP API: Shared hosting/XAMPP
  - Paths: `public_html/donna/` (shim), APIs in `/api/`
  - Place `.env` one level above `public_html` (per `bootstrap_env.php`).
  - Env: `API_SECRET`, `ALLOWED_ORIGINS`, `OPENAI_API_KEY`; SMTP fallback only if needed.
  - Verify: `GET /api/health.php` (with auth), `POST /api/donna_logic.php`.

- Supabase
  - Apply SQL; set keys in env; confirm RLS policies as needed (server routes use service role).

## Engineering Tasks Checklist

- Auth & CORS
  - [x] Integrate Clerk in Next.js (`@clerk/nextjs`, layout, middleware) [WS-C]
  - [x] Add JWT validation in PHP (`api/_auth.php`) with JWKS and fallback `API_SECRET` [WS-A]
  - [x] Restrict CORS via `ALLOWED_ORIGINS` [WS-A]

- Database (Supabase)
  - [x] Create tables (users, chat_sessions, messages, user_memory, abuse_log, email_logs, gmail_tokens) [WS-B]
  - [x] Add `lib/supabase.ts` and `lib/supabase-admin.ts` [WS-B]
  - [x] Add server route to persist chat and logs [WS-B]

- Gmail API
  - [x] Implement OAuth start/callback routes [WS-B]
  - [x] Implement messages list and send routes [WS-B]
  - [x] Store tokens in Supabase; tie to `users.clerk_id` [WS-B]
  - [x] Update/deprecate `api/marketing.php` to proxy or remove [WS-A]

- Realtime WebRTC
  - [x] Confirm `app/api/realtime/token/route.ts` behavior in prod [WS-C]
  - [x] Add simple UI integration to start/stop session [WS-C]

- Docs & Encoding
  - [ ] Replace non-ASCII in `architecture/*` [WS-A]
  - [ ] Update docs to reflect Gmail/Supabase/Clerk [WS-A]
  - [ ] Remove emojis/garbled logs in `server/app.js`, `websocket-server/server.js`, `hooks/use-openai-realtime.ts` [WS-A]

- Rate Limiting
  - [x] Add `api/_rate_limit.php` and apply to critical PHP endpoints [WS-A]

- Env Consistency
  - [x] Update `.env.example` with MVP vars; mark legacy variables [WS-A]

- Frontend UI (Next.js)
  - [x] Chat UI persists sessions/messages via B routes [WS-C]
  - [x] Gmail connect UI + inbox list (max 5) + send composer [WS-C]
  - [x] Error toasts/surface Sentry-reported issues where applicable [WS-C]

## Risks & Mitigations

- Gmail OAuth tokens: Store securely (server-only access), refresh automatically with `googleapis` client; log failures.
- JWT verification in PHP: Use stable libraries (`firebase/php-jwt`); cache JWKS; provide API_SECRET fallback for maintenance windows.
- Supabase schema drift: Use SQL migrations; isolate server-only writes via service role.
- WebRTC variability: Provide text chat fallback; document supported browsers.

## Future (Post-MVP) Backlog

- Advanced analytics/APM (dashboards, tracing, SLA) and full Sentry performance.
- Complex CRM (pipelines, deals, multi-tenant reporting).
- Gmail push notifications via Google Pub/Sub instead of polling.
- Redis caching and job queues.
- Consolidate WS servers or standardize solely on WebRTC path.

---

This PRD reflects the updated in-scope items (Gmail API, Supabase DB, Clerk/JWT) and concrete file paths and snippets to accelerate implementation.
