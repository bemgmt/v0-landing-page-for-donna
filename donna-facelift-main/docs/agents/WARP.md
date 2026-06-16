# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- Stack: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind; hybrid PHP backend for business logic and voice processing; optional Node-based websocket server infra.
- Key folders:
  - app/ … Next.js routes and API routes
  - api/ … PHP endpoints (JSON APIs)
  - voice_system/ … PHP OpenAI/ElevenLabs clients
  - components/ … React UI, shadcn/ui primitives, voice UI
  - websocket-server/ … deployment config (Nixpacks) for a separate Node service
  - next.config.mjs … rewrites/CORS and build behavior

Quick commands (pwsh-friendly)
- Install dependencies
  - npm install
- Dev server (Next.js)
  - npm run dev  # http://localhost:3000 (Next will auto-pick 3001 if busy)
- Build (standalone output enabled)
  - npm run build
- Start in production mode
  - npm run start
- Lint
  - npm run lint
- Sentry (if used in your release process)
  - npm run sentry:release     # create a new release based on package.json version
  - npm run sentry:sourcemaps  # upload sourcemaps from .next/static/chunks/
- Tests
  - npm run test:ws2           # Realtime contract tests
  - npm run test:ws2-audio     # PCM16 helper tests
  - npm run test:ws2:all       # Both
  - npm run test:security:smoke # Token/CORS smoke

Environment and configuration
- Next runtime (TypeScript/ESLint settings)
  - next.config.mjs sets typescript.ignoreBuildErrors: false and eslint.ignoreDuringBuilds: false
  - images.unoptimized: true; output: "standalone"
- Dev-time API rewrites (Next → PHP)
  - In development (NODE_ENV !== 'production') rewrites use DEV_PHP_BASE (default http://127.0.0.1:8000):
    - /api/:path*.php → ${DEV_PHP_BASE}/api/:path*.php
    - /donna/api/:path* → ${DEV_PHP_BASE}/api/:path*
    - /php/:path* → ${DEV_PHP_BASE}/api/:path*
  - Ensure your local PHP server exposes /api at the DEV_PHP_BASE host
- CORS enforcement
  - Enforced in middleware.ts via an origin allowlist (ALLOWED_ORIGINS); no wildcard headers in next.config
- Important environment variables referenced in code
  - Server-side (Next API routes):
    - OPENAI_API_KEY (token issuance)
    - ALLOWED_ORIGINS (CORS allowlist)
    - REMOTE_PHP_BASE, ALLOW_REMOTE_PHP_FANOUT (server-to-server fanout)
    - AUTH_DISABLE_CLERK (dev-only Clerk bypass), JWT_SECRET (dev/production JWT)
    - NEXT_PUBLIC_DEV_JWT (dev-only browser token for token endpoint)
  - Client/browser (optional):
    - NEXT_PUBLIC_API_BASE (only if you want the browser to call PHP directly; requires PHP CORS)
    - NEXT_PUBLIC_WEBSOCKET_URL (default ws://localhost:3001/realtime if using the optional proxy)
  - PHP:
    - OPENAI_API_KEY, ELEVENLABS_API_KEY, MARKETING_API_BASE, etc.

High-level architecture
- Frontend (Next.js, app/)
  - Feature routes: app/chatbot, app/marketing, app/meet, app/sales, app/secretary (each exposes page.tsx for the grid interfaces)
  - API routes (server actions/edge handlers):
    - app/api/realtime/token/route.ts
      - POST returns a short-lived client_secret for OpenAI Realtime (WebRTC)
      - Uses process.env.OPENAI_API_KEY; model name can be provided in request or defaults to OPENAI_REALTIME_MODEL or gpt-4o-realtime-preview-2024-12-17
    - app/api/voice/events/route.ts
      - Accepts client voice events; fans out internally to …/voice/fanout
    - app/api/voice/fanout/route.ts
      - Forwards lightweight events to PHP stubs (marketing.php, sales/overview.php, secretary/dashboard.php)
      - Uses NEXT_PUBLIC_API_BASE or infers http://{origin}/donna in dev
  - TypeScript config (tsconfig.json)
    - Path alias: @/* → project root
- UI components (components/)
  - components/interfaces … feature-specific interfaces (chatbot, secretary, sales, landing, lead generator, analytics, etc.)
  - components/ui … reusable primitives (shadcn/ui, Radix) using Tailwind CSS
  - components/voice … VoiceProvider/UI (mic, panel, nav button)
- Hybrid backend (PHP, api/ and voice_system/)
  - api/donna_logic.php … core assistant logic; builds system prompts per profile (general, sales, receptionist, marketing), maintains chat history and basic memory, optional email actions via api/lib/mail.php
  - api/marketing.php … proxy endpoint to MARKETING_API_BASE with safe limit on requested emails
  - api/voice-chat.php … speech-to-speech pipeline: Whisper → assistant response → ElevenLabs TTS
  - api/realtime-websocket.php … stubs for OpenAI Realtime WebSocket flows (session creation, connection info, processing)
  - bootstrap_env.php … loads .env from directory above public_html to avoid secrets in web root
  - voice_system/openai_realtime_client.php … message templates and helpers for realtime events
  - voice_system/elevenlabs_client.php … TTS requests, voice listings, and helpers
- WebSocket server (websocket-server/)
  - Nixpacks config targets Node 18; intended for a separate deployment (no app source here in this repo)

Local development flows
- Next + PHP together
  - Run npm run dev for the Next app (port 3000 by default)
  - Serve the PHP app so that http://localhost/donna/api/* is reachable (per dev rewrites). The code assumes a shared-host-style layout where PHP’s public_html contains donna/ and a .env file exists one directory above public_html.
- Voice features
  - Client obtains a realtime client secret from POST /api/realtime/token (requires OPENAI_API_KEY)
  - Client voice events can be POSTed to /api/voice/events → fanout to PHP stubs via /api/voice/fanout
- Marketing proxy
  - Set MARKETING_API_BASE in the environment used by PHP; api/marketing.php proxies to {MARKETING_API_BASE}/api/marketing.php

Sentry
- Dependencies include @sentry/nextjs and @sentry/cli
- Release and sourcemap scripts are present (see Quick commands). Configure Sentry auth and organization/project variables in your environment before using these.

Notes distilled from CLAUDE.md (applies here as well)
- TypeScript and ESLint errors are ignored during Next builds; run npm run lint manually to surface lint violations
- Authentication via Clerk and database via Supabase are included as dependencies; wire-up occurs in feature code (not globally enforced)
- The UI follows shadcn/ui + Radix patterns; prefer existing component conventions under components/ui

What’s included now
- Tests and CI are configured:
  - CI runs TypeScript, ESLint, npm audit, WS2 contract tests, security smoke, Next health check, and WebSocket server tests
  - See .github/workflows/ci.yml for details

