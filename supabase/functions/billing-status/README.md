# `billing-status` (server-to-server)

Read-only billing snapshot for Donna’s backend. Stripe webhooks continue to be the **only** writers to billing tables; this function only **reads** `public.billing_status_view` via the service role.

## Endpoint

- **URL**: `POST /functions/v1/billing-status`
- **Auth**: `Authorization: Bearer <DONNA_BILLING_TOKEN>` (never log the token or echo it in errors).
- **Sandbox**: append `?sandbox=1` for deterministic canned responses (no database, no rate-limit accounting).
- **CORS**: no `Access-Control-Allow-*` headers — intended for server-to-server calls only.

## Request body

```json
{
  "email": "string (required)",
  "requested_at": "ISO8601",
  "nonce": "string"
}
```

Missing or empty `email` → **400**.

## Responses

- **200**: Full billing object (`plan` is Stripe price `lookup_key` or price id; `seats_purchased` is Stripe subscription item quantity; `account_status` maps from Stripe subscription status). Includes `seat_type`:
  - `"purchaser"` — the email is a direct subscription owner.
  - `"invite"` — the email is a team member invited via `billing_seat_invites`. In this case `stripe_customer_id` is `null` (the purchaser's Stripe ID is not exposed).
- **404** (unknown billing email / no subscription row / no active seat invite): `{ "email": "...", "account_status": "none" }`.
- **401**: Invalid or missing bearer token. Each failure appends a row to `public.billing_auth_failures` with the client IP (never the token).
- **429**: More than 60 authenticated requests per UTC minute (per deployment token fingerprint). Includes `Retry-After` (seconds).

Other Stripe statuses (`incomplete`, `paused`, `inactive`, etc.) map to **`canceled`** in the API response for conservative defaults.

## Resolution order

The endpoint calls `billing_s2s_resolve_access(email)` which:

1. Normalizes the email (`lower(trim())`).
2. Looks up the email as a **direct purchaser** in `billing_status_view`.
3. If not found, checks `billing_seat_invites` for any invite matching this email where the **purchaser's subscription is active/trialing**.
4. If a seat invite resolves, returns `seat_type: "invite"` with the purchaser's plan data but `stripe_customer_id: null`.
5. If neither resolves, returns 404.

## Entitlements (out of scope here)

Commercial caps (e.g. Core vs Full Toolkit seat limits) and feature gating are **not** enforced by this function. Donna should treat `plan`, `seats_purchased`, and `account_status` as inputs to its own entitlement layer.

## Supabase secrets

Set on the linked Supabase project (never commit values):

```bash
openssl rand -hex 32
supabase secrets set DONNA_BILLING_TOKEN="<paste-64-hex-here>"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions by the platform.

### Rotating `DONNA_BILLING_TOKEN`

1. Generate a new secret: `openssl rand -hex 32`.
2. Set it: `supabase secrets set DONNA_BILLING_TOKEN="<new>"`.
3. Redeploy this function: `supabase functions deploy billing-status`.
4. Update Donna’s backend configuration to use the new token.
5. Optionally overlap briefly: deploy Donna first with the new token, then revoke knowledge of the old token (old requests fail with **401**). Rate-limit buckets are keyed by a SHA-256 fingerprint of the token, so a rotation resets per-minute counters for the new secret.

## Local tests

From the repo root (requires [Deno](https://deno.land/) or `npx deno`):

```bash
deno test -A --config=supabase/functions/billing-status/deno.json supabase/functions/billing-status/handler_test.ts
```

## Deploy

```bash
supabase functions deploy billing-status
```

Ensure `[functions.billing-status] verify_jwt = false` remains in `supabase/config.toml` so the platform does not require a Supabase JWT for this route (custom bearer only).
