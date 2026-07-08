# External Landing, Cognito, Stripe, And Billing PRD/Spec

Date: 2026-07-08.
Audience: engineer or AI coding agent working in the external landing and billing site codebase.
Scope: sign-in, sign-up, checkout, Stripe customer ownership, subscription status, and Donna billing access.
Related Donna app change: Donna MCP admin access is separate and should remain gated by Donna Cognito identity.

## 1. Objective

Donna should have one account identity across the main app and the external landing or billing site.
The shared identity provider should be Donna Cognito.
Stripe should remain the source of truth for payment and subscription lifecycle events.
The billing service or billing database should remain the source of truth for computed entitlement status.
Supabase can remain as an implementation detail during migration, but Donna should stop depending on an email-only lookup that asks Supabase whether a person has an account.

## 2. Product Outcome

A customer can start on the landing site, sign up or sign in with the same Cognito account used by Donna, buy a plan through Stripe, and then enter Donna with the same identity and active billing status.
Donna can check the subscription for the Cognito user without asking a remote system to infer the account only from email.
Account linking should be deterministic through Cognito `sub`, with email used as contact metadata and migration fallback only.
The handoff should not require sharing personal AWS, Supabase, Stripe, or Donna credentials with the external-site developer.

## 3. Current Donna Billing Shape

Donna currently calls an external billing service configured by `BILLING_SERVICE_URL`.
That service is documented as a Stripe plus Supabase system.
Donna sends a scoped billing email to the remote status endpoint and caches the response in Donna.
Donna does not directly query Supabase from the app code.
Donna has read-only billing routes such as `/api/v1/billing/status` and `/api/v1/billing/refresh`.
The current pain is not only polling frequency.
The current pain is that the account join key is email, while Donna authentication already has a stronger Cognito identity.

## 4. Non Goals

Do not replace Stripe as the payment source of truth.
Do not make Cognito the canonical subscription ledger.
Do not put Stripe secrets, Supabase service-role keys, or AWS admin credentials in frontend code.
Do not require the external-site developer to use the Donna owner's personal credentials.
Do not remove Supabase in the first release unless the external codebase already has a replacement datastore ready.
Do not break existing paid users who only have an email-linked billing record today.

## 5. Identity Model

Cognito `sub` is the primary account identifier.
Cognito email is contact metadata and a migration fallback.
Stripe `customer.id` is the primary billing customer identifier.
Stripe `subscription.id` is the primary subscription identifier.
The billing service should store a durable link from `cognito_sub` to `stripe_customer_id`.
The billing service may also store normalized email, but it must not use email as the long-term primary key.

Recommended billing account table shape:

```text
billing_accounts
- id
- cognito_sub
- email
- stripe_customer_id
- created_at
- updated_at
- migration_source
```

Recommended subscription projection shape:

```text
billing_subscriptions
- id
- billing_account_id
- stripe_subscription_id
- stripe_customer_id
- status
- plan_key
- current_period_start
- current_period_end
- cancel_at_period_end
- trial_end
- entitlements_json
- last_stripe_event_id
- updated_at
```

## 6. Cognito And Subscription Status

Cognito should not become the source of truth for subscription status.
Subscription status changes too often and is driven by Stripe webhooks, retries, payment failures, cancellations, plan switches, trials, and charge disputes.
Cognito custom attributes can become stale and are not a good enforcement boundary by themselves.
If the team wants status visible in Cognito, store only a non-authoritative cache hint such as `custom:billing_status_hint` and `custom:plan_hint`.
Donna and the landing site should still ask the billing service for the effective entitlement before gating paid features.
The durable improvement is to check billing by Cognito `sub`, not by email.

## 7. External Site Auth Requirements

The external site must support Cognito sign-up and sign-in.
The external site may use Cognito Hosted UI or a custom UI backed by Cognito APIs.
Hosted UI is preferred if the site does not need a custom auth experience.
Custom UI is acceptable if it already exists and can be wired safely.
The external site must request `openid`, `email`, and `profile` scopes.
The external site must receive and store no raw Cognito refresh tokens outside the normal auth library session storage.
The external site must use allowed callback URLs and logout URLs configured in the Donna Cognito app client.
The external site must validate the Cognito JWT server-side before creating checkout sessions or returning account-specific billing data.

## 8. Checkout Requirements

Checkout must be created server-side.
The checkout session must be tied to the authenticated Cognito user.
The Stripe customer should be reused when the billing service already has a `stripe_customer_id` for the Cognito `sub`.
If no customer exists, create one with `metadata.cognito_sub` and normalized email.
The checkout session must include metadata that survives webhook processing.
At minimum, include `cognito_sub`, normalized `email`, and an internal `billing_account_id` when available.

Recommended checkout session create request:

```json
{
  "plan_key": "pro",
  "success_url": "https://app.example.com/billing/success",
  "cancel_url": "https://app.example.com/pricing",
  "workspace_hint": null
}
```

Recommended server-side checkout context:

```json
{
  "cognito_sub": "from_verified_jwt_sub",
  "email": "from_verified_jwt_email",
  "stripe_customer_id": "cus_optional_existing",
  "plan_key": "pro"
}
```

The frontend should never pass `cognito_sub` as a trusted value.
The server must derive it from the verified Cognito token.

## 9. Stripe Webhook Requirements

Webhook verification is mandatory.
The webhook handler must dedupe by Stripe event id.
The webhook handler must update the billing projection for `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, and `invoice.payment_failed`.
The webhook handler must be idempotent.
The webhook handler must resolve a billing account by `stripe_customer_id` first.
If that fails during migration, it may fallback to metadata `cognito_sub`, then normalized email.
The fallback path must log a safe migration warning without exposing raw provider payloads.

## 10. Billing Status API Contract

Donna needs a stable server-to-server billing status contract.
The preferred request key is `cognito_sub`.
Email may be included as fallback and diagnostics, but should not be required after cutover.
The external billing service should accept a bearer service token or signed server-to-server request from Donna.
The service token must be stored only in server-side secrets.

Recommended request:

```json
{
  "cognito_sub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "email": "person@example.com",
  "requested_at": "2026-07-08T00:00:00.000Z",
  "contract_version": "2026-07-08"
}
```

Recommended response:

```json
{
  "ok": true,
  "account": {
    "cognito_sub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "email": "person@example.com",
    "stripe_customer_id": "cus_...",
    "account_status": "active"
  },
  "subscription": {
    "status": "active",
    "plan_key": "pro",
    "current_period_end": "2026-08-08T00:00:00.000Z",
    "cancel_at_period_end": false,
    "trial_end": null
  },
  "entitlements": {
    "lead_generation": true,
    "voice": true,
    "mcp": false
  },
  "access": {
    "allowed": true,
    "reason": "active_subscription"
  },
  "source": {
    "matched_by": "cognito_sub",
    "version": "2026-07-08"
  }
}
```

Recommended not-found response:

```json
{
  "ok": false,
  "account": null,
  "subscription": null,
  "entitlements": {},
  "access": {
    "allowed": false,
    "reason": "account_not_found"
  },
  "source": {
    "matched_by": "none",
    "version": "2026-07-08"
  }
}
```

## 11. Donna App Contract Change

Donna should update its billing client to send Cognito `sub` and email to the external billing service.
Donna should prefer a `matched_by: "cognito_sub"` response.
Donna should continue to handle `matched_by: "email"` during migration.
Donna should cache the normalized response in the existing billing cache.
Donna should keep `/api/v1/billing/status` and `/api/v1/billing/refresh` read-only.
Donna should not expose the server-to-server billing token to the browser.

## 12. Migration Strategy

Phase 0 is discovery.
Inventory the external site auth stack, Supabase schema, Stripe webhook handler, checkout session creator, and deployment secret store.
Confirm whether the external site already uses Supabase Auth, custom email auth, magic links, or a third-party auth provider.
Confirm whether Supabase is only the billing datastore or also the user identity provider.

Phase 1 is Cognito app client setup.
Create or reuse a Cognito app client for the external site.
Configure callback URLs, logout URLs, allowed origins, and scopes.
Keep secrets in the deployment platform secret store.
Do not give the developer AWS console credentials if an owner can configure the app client and hand over non-secret public config.

Phase 2 is sign-up and sign-in wiring.
Replace the external site's auth entry points with Cognito.
For existing signed-in users, add an account linking screen only if the old external identity cannot be deterministically mapped.
Store Cognito `sub` in the billing account record after the first verified sign-in.

Phase 3 is checkout binding.
Update checkout creation to require a verified Cognito session.
Resolve or create the Stripe customer by Cognito `sub`.
Write Cognito `sub` into Stripe customer metadata and checkout session metadata.

Phase 4 is webhook projection.
Update Stripe webhook processing to write subscription state to the billing projection keyed by `stripe_customer_id` and linked billing account.
Backfill `cognito_sub` from Stripe customer metadata where available.
Fallback to email only for migration records.

Phase 5 is Donna billing contract.
Deploy a new billing status endpoint version that accepts `cognito_sub`.
Update Donna to send both `cognito_sub` and email.
Keep the old email path until enough accounts are linked.

Phase 6 is cutover.
Track percentage of billing status reads matched by `cognito_sub`.
Once all active paid accounts are linked, make email-only matches a warning path.
After a monitoring window, remove email-only enforcement as a primary path.

Phase 7 is optional Supabase removal.
Only remove Supabase if checkout, webhooks, billing projection, admin tooling, and historical reports have a replacement datastore.
If Supabase remains, keep it as a billing datastore, not the identity source.

## 13. Environment And Credential Handoff

The external-site developer should receive Cognito public configuration values.
These include user pool id, app client id, region, hosted UI domain if used, allowed callback URLs, and logout URLs.
The external-site developer should not receive personal AWS credentials.
The external-site developer should not receive Donna production database credentials.
Stripe secret keys should be delivered only through the deployment platform secret store or Stripe restricted keys where appropriate.
Stripe webhook signing secrets should be delivered only through the deployment platform secret store.
Supabase service-role keys should not be sent over chat.
If the developer must run migrations against Supabase, provide temporary least-privilege access or run the migration on their behalf.
Donna server-to-server billing tokens should be rotated through the secret store, not copied into a PRD.

## 14. Security Requirements

Validate every Cognito JWT server-side before checkout and account-specific billing reads.
Check issuer, audience, expiration, and signature.
Do not trust `email`, `sub`, plan, or customer id values supplied directly by the frontend.
Verify Stripe webhooks before parsing business actions.
Make webhook handlers idempotent.
Store only normalized subscription projection data needed for entitlements.
Do not store raw Stripe event payloads unless there is a retention policy and redaction strategy.
Log safe identifiers and event ids, not full provider payloads.
Use a redirect allowlist for success, cancel, callback, and logout URLs.
Add audit logs for account linking, checkout creation, webhook projection, and billing status reads.

## 15. Acceptance Criteria

A new user can sign up on the landing site through Cognito.
A returning Donna user can sign in on the landing site with the same Cognito account.
Checkout creates or reuses a Stripe customer linked to Cognito `sub`.
Stripe webhooks update a subscription projection linked to the Cognito account.
Donna billing status reads can match by Cognito `sub`.
Existing email-only paid accounts still work during migration.
The billing status response reports whether it matched by `cognito_sub`, `email`, or neither.
No frontend code contains Stripe secret keys, Supabase service-role keys, or Donna server-to-server tokens.
A non-subscribed Cognito user gets a deterministic `account_not_found`, `inactive_subscription`, `past_due`, or `plan_not_entitled` response.
A subscribed Cognito user gets active entitlements in Donna after checkout and webhook processing.

## 16. Test Matrix

Test new Cognito sign-up with checkout success.
Test existing Cognito sign-in with checkout success.
Test cancelled checkout.
Test payment failure and `past_due` status.
Test cancellation at period end.
Test plan switch.
Test webhook retry idempotency.
Test billing status by Cognito `sub`.
Test migration fallback by email.
Test unknown Cognito user.
Test changed email on the Cognito account.
Test changed email in Stripe customer metadata.
Test disabled or deleted Cognito user if the app supports that state.
Test server-to-server billing status with missing token.
Test server-to-server billing status with invalid token.

## 17. Rollout Checklist

Create Cognito app client and allowed URLs.
Add external-site env vars in staging.
Implement Cognito auth in staging.
Implement checkout binding in staging.
Implement webhook projection in staging.
Implement billing status v2 in staging.
Update Donna staging to send Cognito `sub`.
Run full test matrix in staging.
Backfill `cognito_sub` for existing active paid accounts.
Enable production dual lookup.
Monitor `matched_by` rates.
Rotate any temporary migration credentials.
Remove temporary developer access.
Promote Cognito `sub` matching to primary enforcement.

## 18. AI Coding Agent Instructions

Read the existing external-site auth, checkout, webhook, and billing status code before changing files.
Find the smallest integration point that can make Cognito the identity source without rewriting unrelated UI.
Do not manually edit generated files, lockfiles, or deployment artifacts.
Add focused tests around auth validation, checkout metadata, webhook idempotency, and billing status matching.
Keep the old email fallback until the migration data proves it is safe to remove.
Do not print secrets in test output.
Do not commit local `.env` files.
Make all production secrets configurable through the existing deployment secret mechanism.

## 19. Open Questions For The External Site Owner

What auth provider does the external site use today?
Is Supabase Auth used, or is Supabase only a database and edge-function host?
Where is checkout session creation implemented?
Where are Stripe webhooks handled?
Which table or collection currently maps email to Stripe customer?
Does the site already have an admin billing dashboard?
Which deployment platform owns staging and production secrets?
Can the external site support Cognito Hosted UI, or does it require custom auth UI?
What active paid accounts need a Cognito `sub` backfill before cutover?

## 20. Definition Of Done

The landing site and Donna app share the same Cognito identity.
Stripe customers and subscriptions are linked to Cognito `sub`.
Donna billing status can be resolved by Cognito `sub`.
Email-only lookup is a migration fallback, not the primary account contract.
No personal credentials are shared with the external-site developer.
The implementation has focused tests and a rollback plan.
