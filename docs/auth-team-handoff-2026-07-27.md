# Auth team handoff: Cognito recovery and identity mapping

Date: 2026-07-27  
Production app: `https://aidonna.co`  
Verified app build: `dbaf45e53ec0ec69887e874fac4d8c5d662727a9`

## Guardrail

Do not change Cognito configuration as part of this handoff without separate, explicit authorization. The app-owned fixes in `dbaf45e` changed no Cognito client, callback, sign-out URL, domain, user-pool, policy, or hosted-UI setting.

## 1. Hosted login input and error behavior

### Current production behavior

- Cognito's hosted login exposes the email field with a placeholder-derived name rather than a durable application label.
- A malformed email is submitted as generic text, receives a generic hosted error, and the entered value is cleared.
- This behavior occurs on the Cognito-hosted page, outside the Next.js route and component tree.

### Required user behavior

- Email and password controls have durable labels and correct input semantics.
- Empty or malformed input is explained next to the relevant control without clearing the user's email.
- Incorrect credentials use a generic, non-enumerating response and never expose whether an account exists.
- The requested local return destination remains intact through correction and successful sign-in.

## 2. Unconfirmed-account recovery

### Current production behavior

- An unconfirmed user remains on the Cognito-hosted login surface after the provider error.
- The user is not given a reliable application path to resend a confirmation code, confirm the account, or return to the requested destination.
- The existing app-side `/signup/confirm` page cannot consistently recover this provider-owned state.

### Required user behavior

- Detect an unconfirmed account without exposing account enumeration details.
- Offer resend-confirmation and confirmation-code entry in a first-party recovery flow.
- After confirmation, return to sign-in with the originally requested protected path preserved.
- Cover expired, invalid, and reused confirmation codes with recoverable messages.

## 3. Cognito-to-Supabase identity mapping

### Current production behavior

- The portal resolves NextAuth/Cognito sessions by email.
- `public.member_profiles.user_id` is a non-null foreign key to `auth.users.id`.
- The current auto-provision path attempts to insert the Cognito subject directly into `member_profiles.user_id`; this cannot satisfy the Supabase Auth foreign key for a Cognito-only user.
- Production QA therefore required a controlled shadow Supabase Auth user plus a `free_member` profile for the confirmed Cognito QA email.

### Required design outcome

- Define one durable mapping between the Cognito subject and the portal profile without requiring ad hoc shadow identities.
- Preserve existing billing-account linkage by normalized email and Cognito subject.
- Preserve purchaser versus invited-seat behavior and never infer partner/admin access from client state.
- Make first-login provisioning transactional and idempotent under retries.
- Include a rollback-safe migration for existing Supabase-auth, Cognito, purchaser, and invited-seat identities.

## Regression contract

- `/portal/profile?tab=security` returns to that exact destination after sign-in.
- Malformed external `next` values cannot redirect away from `aidonna.co`.
- Sign-out clears both the local NextAuth session and the Cognito hosted session.
- An ordinary `free_member` receives no `/partner` or `/admin` capabilities.
- Active purchaser and accepted seat-invite access continue to resolve through the Cognito-aware billing-status path.
- Password reset, expired/reused reset code, unconfirmed-account recovery, refresh persistence, and sign-out are exercised through the real production UI.

## Existing evidence

- Signoff project: `a602360f-e38c-489e-93ef-0fec91fff2ae`
- Auth slice board: `3f6ea0ff-beb8-425b-8e0b-a9142ea35117`
- Pre-fix run: `e30a5b4e-f402-4896-9463-894ce1cc0e71`
- Production retest run: `2d124e67-5eda-4f78-9413-6b7fd3663ccb`
