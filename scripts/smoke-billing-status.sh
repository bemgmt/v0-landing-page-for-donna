#!/usr/bin/env bash
# Smoke-test billing-status against production (or any deployed URL).
# Requires: curl, jq. On Windows, use Git Bash or WSL.
set -euo pipefail

: "${SUPABASE_FUNCTION_URL:?Set SUPABASE_FUNCTION_URL (e.g. https://<ref>.supabase.co/functions/v1/billing-status)}"
: "${DONNA_BILLING_TOKEN:?Set DONNA_BILLING_TOKEN}"
: "${SMOKE_BILLING_EMAIL:?Set SMOKE_BILLING_EMAIL to a known test customer email}"

if ! command -v curl >/dev/null 2>&1; then echo "curl is required"; exit 1; fi
if ! command -v jq >/dev/null 2>&1; then echo "jq is required"; exit 1; fi

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")"
NONCE="$(openssl rand -hex 8 2>/dev/null || head -c 16 /dev/urandom | xxd -p -c 256)"

BODY="$(jq -n \
  --arg email "$SMOKE_BILLING_EMAIL" \
  --arg ts "$TS" \
  --arg nonce "$NONCE" \
  '{email:$email, requested_at:$ts, nonce:$nonce}')"

TMP="$(mktemp)"
HTTP_CODE="$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "$SUPABASE_FUNCTION_URL" \
  -H "Authorization: Bearer ${DONNA_BILLING_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$BODY")"

echo "HTTP $HTTP_CODE"
cat "$TMP"
echo ""

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "404" ]]; then
  echo "Unexpected status (expected 200 or 404)"
  rm -f "$TMP"
  exit 1
fi

if [[ "$HTTP_CODE" == "200" ]]; then
  jq -e '
    (.email | type) == "string"
    and (.account_status | type) == "string"
    and (.plan | type) == "string"
    and (.current_period_end | type) == "string"
    and (.cancel_at_period_end | type) == "boolean"
    and (.seats_purchased | type) == "number"
    and (.stripe_customer_id | type) == "string"
    and (.notification_emails | type) == "array"
    and (.source_of_truth_at | type) == "string"
    and ((.notification_emails | map(type == "string") | all) // false)
  ' "$TMP" >/dev/null
  echo "Schema OK (200)"
else
  jq -e '
    (. | keys | sort) == ["account_status","email"]
    and (.account_status == "none")
    and (.email | type) == "string"
  ' "$TMP" >/dev/null
  echo "Schema OK (404 none)"
fi

rm -f "$TMP"

# Optional: test seat invite resolution
if [[ -n "${SMOKE_SEAT_INVITE_EMAIL:-}" ]]; then
  echo ""
  echo "--- Seat invite test: $SMOKE_SEAT_INVITE_EMAIL ---"
  BODY2="$(jq -n \
    --arg email "$SMOKE_SEAT_INVITE_EMAIL" \
    --arg ts "$TS" \
    --arg nonce "${NONCE}_seat" \
    '{email:$email, requested_at:$ts, nonce:$nonce}')"

  TMP2="$(mktemp)"
  HTTP_CODE2="$(curl -sS -o "$TMP2" -w "%{http_code}" \
    -X POST "$SUPABASE_FUNCTION_URL" \
    -H "Authorization: Bearer ${DONNA_BILLING_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$BODY2")"

  echo "HTTP $HTTP_CODE2"
  cat "$TMP2"
  echo ""

  if [[ "$HTTP_CODE2" == "200" ]]; then
    jq -e '
      (.account_status | IN("active", "trialing"))
      and (.plan | type) == "string"
      and (.seat_type | type) == "string"
    ' "$TMP2" > /dev/null
    echo "Seat invite schema OK (200, seat_type=$(jq -r '.seat_type' "$TMP2"))"
  elif [[ "$HTTP_CODE2" == "404" ]]; then
    echo "Seat invite not found (404) — check billing_seat_invites table"
  else
    echo "Unexpected seat invite status $HTTP_CODE2"
  fi
  rm -f "$TMP2"
fi
