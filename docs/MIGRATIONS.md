# Verifying Supabase migrations

Run these from the repository root when the Supabase CLI is installed (`npx supabase` or global `supabase`).

## Linked remote project

```bash
supabase link   # once, if not already linked
supabase migration list
```

Confirm every SQL file under `supabase/migrations/` appears as applied on the remote.

## Local Supabase (Docker)

Start the stack, then:

```bash
supabase migration list --local
```

## SQL smoke checks (Dashboard SQL editor or `supabase db query`)

- Tables: `public.member_profiles`, `public.billing_subscriptions`, `public.billing_customers`, `public.audit_events`
- RLS: `member_profiles` has policies including `mp_select_own_or_staff`

If a migration failed on a shared remote, add a **new** migration to fix forward; do not rewrite history of already-applied files.
