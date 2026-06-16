# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (layouts/pages and API, e.g. `app/api/realtime/token/route.ts`).
- `components/`, `hooks/`, `lib/`: UI, reusable hooks, realtime utilities.
- `websocket-server/`: Optional WS proxy (own `package.json`).
- `server/`: Local bridge (optional) for realtime experiments.
- `api/`: PHP stubs accessed in dev via rewrites.
- `public/`, `styles/`: Static assets and Tailwind CSS.

## Build, Test, and Development Commands
- App: `npm run dev` (dev), `npm run build` (prod), `npm start` (serve), `npm run lint` (ESLint).
- Proxy (opt‑in): `cd websocket-server && npm run dev` or `npm start`.
- Contract test (no network): `node scripts/ws2-contract-test.mjs`.
- Live realtime smoke: `node test-realtime-websocket.mjs` (requires `OPENAI_API_KEY`).
- Sentry (optional): `npm run sentry:release`, `npm run sentry:sourcemaps`.

## Coding Style & Naming Conventions
- TypeScript-first, functional React components; 2‑space indentation.
- Filenames in kebab-case (e.g., `chatbot-control-interface.tsx`); exports in PascalCase.
- Prefer Tailwind classes over inline styles; keep JSX classnames readable.

## Testing Guidelines
- No unit runner configured. Use the contract test and UI flows for smoke coverage.
- If adding tests, colocate `*.test.ts(x)` beside sources or propose a `__tests__/` suite in a separate PR.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits where possible (`feat(scope): …`, `fix(scope): …`).
- PRs: clear description, linked issues, env setup notes, test steps, screenshots/GIFs for UI.
- Keep changes scoped; update docs when behavior or envs change.

## Security & Configuration Tips
- Secrets in `.env.local` only. Required: `OPENAI_API_KEY`. Optional per path:
  - WebRTC default: set `NEXT_PUBLIC_USE_WS_PROXY=false` (default). Uses `/api/realtime/token`.
  - WS proxy (opt‑in): set `NEXT_PUBLIC_USE_WS_PROXY=true` and `NEXT_PUBLIC_WEBSOCKET_URL`.
  - Proxy hardening: `ENABLE_WS_PROXY`, `JWT_SECRET`, `ALLOWED_ORIGINS`.
  - PHP stubs: `NEXT_PUBLIC_API_BASE` (e.g., `/donna`).
- HTTPS required for mic access. Dev rewrites forward only `/api/*.php` to PHP; Next API routes are not shadowed.
# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (pages, layouts, API e.g. `app/api/realtime/token/route.ts`).
- `components/`, `hooks/`, `lib/`: UI, reusable hooks, realtime/audio helpers.
- `websocket-server/`: Optional secured WS proxy (own `package.json`).
- `server/`: Local bridge (legacy experiments for realtime).
- `api/`: PHP stubs used in dev via rewrites.
- `public/`, `styles/`: Static assets and Tailwind CSS.
- `scripts/`: CI and smoke tests (e.g., `ws2-*`).

## Build, Test, and Development Commands
- App: `npm run dev` (dev server), `npm run build` (prod build), `npm start` (serve build), `npm run lint` (ESLint).
- Realtime smokes (no network): `npm run test:ws2` (protocol), `npm run test:ws2-audio` (PCM16), `npm run test:ws2-reconnect`, `npm run test:ws2-latency`, `npm run test:ws2:all`.
- WS proxy (opt‑in): `cd websocket-server && npm ci && ENABLE_WS_PROXY=true node server.js`.
- End‑to‑end (if configured): `npm run test:e2e` (Playwright).

## Coding Style & Naming Conventions
- TypeScript-first; functional React components; 2‑space indentation.
- Filenames in kebab-case (e.g., `chatbot-control-interface.tsx`); component exports in PascalCase.
- Prefer Tailwind in JSX; avoid inline styles and deeply nested classnames.
- Keep modules small and colocate helpers near usage.

## Testing Guidelines
- Unit/integration: colocate `*.test.ts`/`*.test.tsx` next to sources.
- Realtime: use `scripts/ws2-*.mjs` for protocol, audio, reconnect, and latency smokes.
- CI runs type/lint/audit; optional e2e uses Playwright. Aim to keep smokes < 60s.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits preferred (`feat(scope): …`, `fix(scope): …`, `chore(ci): …`).
- PRs include: clear description, linked issues, env/setup notes, test steps, and screenshots/GIFs for UI.
- Keep changes focused; update docs when behavior or envs change.

## Security & Configuration Tips
- Required secrets: `OPENAI_API_KEY`.
- Realtime (default WebRTC): set `NEXT_PUBLIC_USE_WS_PROXY=false` (or omit; QA can override with `?proxy=0/1`). Token endpoint: `/api/realtime/token`.
- WS proxy (opt‑in): set `ENABLE_WS_PROXY=true`, `NEXT_PUBLIC_WEBSOCKET_URL`, and secure with `JWT_SECRET`, `ALLOWED_ORIGINS`, optional `AUTH_TIMEOUT_MS`.
- Dev rewrites: only `/api/*.php` is forwarded to PHP; Next API routes are not shadowed. Use `NEXT_PUBLIC_API_BASE` (e.g., `/donna`) for PHP.
- Mic requires HTTPS in browsers.
