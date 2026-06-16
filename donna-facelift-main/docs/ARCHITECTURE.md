# ARCHITECTURE.md

Last updated: 2025-09-09
Owner: WARP (WS5)

High-level architecture

    [Browser UI]
        ├─ Text UI (ChatWidget, interfaces/*)
        ├─ Voice UI (Receptionist/VoicePanel)
        │   ├─ WebRTC (preferred) via OpenAI Realtime
        │   └─ Optional WS proxy (Node) behind feature flag
        └─ Batch voice (legacy) via PHP endpoints

    [Next.js App]
        ├─ API routes
        │   ├─ /api/realtime/token  ← issues client_secret (auth+origin+rate-limit)
        │   ├─ /api/voice/events|fanout (internal fanout/hooks)
        │   └─ /api/health          (health JSON)
        └─ Middleware (CORS allowlist)

    [WebSocket Proxy (Node, optional)]
        ├─ /realtime (WS) ← verifyClient: origin validate + rate limit + conn caps
        └─ Bridges to OpenAI Realtime (wss) with server API key
           (Feature-flagged, JWT required if enabled)

    [PHP API (legacy/back-end)]
        ├─ donna_logic.php           (core chat logic)
        ├─ marketing.php/simple.php  (proxy to marketing backend)
        ├─ voice-chat.php            (batch speech-to-speech path)
        ├─ sales/overview.php, etc.  (support endpoints)
        └─ lib/* (CORS, rate-limiter, security-headers, input-validator, ErrorResponse)

    [External Services]
        ├─ OpenAI Realtime API (WebRTC/WS)
        └─ ElevenLabs (TTS), others as configured

Key flows
- Realtime (preferred, WebRTC)
  1) Browser requests client token: POST /api/realtime/token (requires auth + allowed origin; rate-limited)
  2) Browser creates RealtimeSession using returned client_secret; mic/speaker handled by SDK
  3) Streaming transcript/audio events; with VAD off, UI commits then requests response; with VAD on, auto-response on speech_stopped

- Realtime (optional, WS proxy)
  1) Browser connects to ws://server/realtime only if NEXT_PUBLIC_USE_WS_PROXY=true
  2) Must authenticate via JWT; origin validated, rate-limited, and connection-capped
  3) Proxy forwards events to OpenAI Realtime and relays responses

- Batch voice (legacy)
  1) Browser records audio and POSTs to PHP API (voice-chat.php)
  2) PHP calls Whisper/GPT/ElevenLabs and returns transcript + audio

Security posture
- CORS: Allowlist enforced (middleware.ts for Next; api/lib/cors.php for PHP)
- Token issuance: Auth + origin validation + rate-limits; input validation and security logging
- WS proxy: Disabled by default; if enabled, JWT auth + origin allowlist + rate-limits
- Logging: PII-scrubbed logs in PHP; structured security logs in Next
- Data retention: Runtime data/logs ignored in VCS; rotation and cleanup policies

Configuration (key envs)
- ALLOWED_ORIGINS, PRODUCTION_DOMAIN
- NEXT_PUBLIC_USE_WS_PROXY=false (WebRTC-first)
- NEXT_PUBLIC_ENABLE_VAD=false, ENABLE_SERVER_VAD=false (VAD off by default)
- ENABLE_WS_PROXY=false (prod)
- JWT_SECRET (if WS proxy enabled)
- OPENAI_API_KEY, OPENAI_REALTIME_MODEL

References
- ADR Index: MVP/adrs/README.md
- Token Hardening: MVP/adrs/phase-1-task-06-token-hardening.md
- WS Proxy Auth: MVP/adrs/phase-1-task-03-ws-proxy-auth.md
- Realtime Path: MVP/adrs/phase-3-task-04-single-realtime-path.md
- CORS Tightening: MVP/adrs/phase-1-task-02-tighten-cors.md
- Security Headers (PHP): MVP/adrs/phase-7-task-03-php-security-headers.md
- Checkpoint log: MVP/checkpoint1_updates.md
