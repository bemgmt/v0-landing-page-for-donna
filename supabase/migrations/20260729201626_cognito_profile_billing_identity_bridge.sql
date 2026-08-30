-- Keep Cognito as the authentication source while giving portal profiles and
-- Stripe billing records durable application-owned relationships.

ALTER TABLE public.member_profiles ADD COLUMN IF NOT EXISTS cognito_sub text;
ALTER TABLE public.member_profiles ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS member_profiles_cognito_sub_idx
  ON public.member_profiles (cognito_sub) WHERE cognito_sub IS NOT NULL;
CREATE INDEX IF NOT EXISTS member_profiles_normalized_email_idx
  ON public.member_profiles (lower(btrim(email))) WHERE email IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'member_profiles_identity_check'
      AND conrelid = 'public.member_profiles'::regclass
  ) THEN
    ALTER TABLE public.member_profiles
      ADD CONSTRAINT member_profiles_identity_check
      CHECK (user_id IS NOT NULL OR cognito_sub IS NOT NULL) NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.member_profiles VALIDATE CONSTRAINT member_profiles_identity_check;
COMMENT ON COLUMN public.member_profiles.cognito_sub IS
  'Immutable Cognito subject used by NextAuth-authenticated portal accounts.';

ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS member_profile_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_accounts_member_profile_id_fkey'
      AND conrelid = 'public.billing_accounts'::regclass
  ) THEN
    ALTER TABLE public.billing_accounts
      ADD CONSTRAINT billing_accounts_member_profile_id_fkey
      FOREIGN KEY (member_profile_id) REFERENCES public.member_profiles(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END;
$$;
CREATE UNIQUE INDEX IF NOT EXISTS billing_accounts_member_profile_id_idx
  ON public.billing_accounts (member_profile_id) WHERE member_profile_id IS NOT NULL;

ALTER TABLE public.billing_subscriptions ADD COLUMN IF NOT EXISTS member_profile_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_subscriptions_member_profile_id_fkey'
      AND conrelid = 'public.billing_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.billing_subscriptions
      ADD CONSTRAINT billing_subscriptions_member_profile_id_fkey
      FOREIGN KEY (member_profile_id) REFERENCES public.member_profiles(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_subscriptions_member_profile_id_key'
      AND conrelid = 'public.billing_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.billing_subscriptions
      ADD CONSTRAINT billing_subscriptions_member_profile_id_key UNIQUE (member_profile_id);
  END IF;
END;
$$;
ALTER TABLE public.billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_user_id_fkey;

COMMENT ON COLUMN public.billing_subscriptions.user_id IS
  'Compatibility identity key. The authoritative application link is member_profile_id.';

-- Backfill only deterministic one-to-one identities. Ambiguous email matches
-- remain unlinked for explicit reconciliation.
WITH unique_profile_email AS (
  SELECT lower(btrim(email)) AS email_key, (array_agg(id ORDER BY id))[1] AS profile_id
  FROM public.member_profiles
  WHERE email IS NOT NULL AND btrim(email) <> ''
  GROUP BY lower(btrim(email)) HAVING count(*) = 1
),
unique_billing_identity AS (
  SELECT lower(btrim(email)) AS email_key, min(cognito_sub) AS cognito_sub
  FROM public.billing_accounts
  WHERE email IS NOT NULL AND btrim(email) <> '' AND cognito_sub IS NOT NULL
  GROUP BY lower(btrim(email)) HAVING count(DISTINCT cognito_sub) = 1
)
UPDATE public.member_profiles profile
SET cognito_sub = billing.cognito_sub, updated_at = now()
FROM unique_profile_email profile_email
JOIN unique_billing_identity billing USING (email_key)
WHERE profile.id = profile_email.profile_id AND profile.cognito_sub IS NULL;

UPDATE public.billing_accounts account
SET member_profile_id = profile.id, updated_at = now()
FROM public.member_profiles profile
WHERE account.member_profile_id IS NULL
  AND account.cognito_sub IS NOT NULL
  AND profile.cognito_sub = account.cognito_sub;

WITH unique_profile_email AS (
  SELECT lower(btrim(email)) AS email_key, (array_agg(id ORDER BY id))[1] AS profile_id
  FROM public.member_profiles
  WHERE email IS NOT NULL AND btrim(email) <> ''
  GROUP BY lower(btrim(email)) HAVING count(*) = 1
),
unique_billing_email AS (
  SELECT lower(btrim(email)) AS email_key, (array_agg(id ORDER BY id))[1] AS billing_account_id
  FROM public.billing_accounts
  WHERE email IS NOT NULL AND btrim(email) <> ''
  GROUP BY lower(btrim(email)) HAVING count(*) = 1
)
UPDATE public.billing_accounts account
SET member_profile_id = profile_email.profile_id, updated_at = now()
FROM unique_billing_email billing_email
JOIN unique_profile_email profile_email USING (email_key)
WHERE account.id = billing_email.billing_account_id
  AND account.member_profile_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.billing_accounts linked
    WHERE linked.member_profile_id = profile_email.profile_id
  );

UPDATE public.billing_subscriptions subscription
SET billing_account_id = account.id
FROM public.billing_accounts account
WHERE subscription.billing_account_id IS NULL
  AND subscription.stripe_customer_id = account.stripe_customer_id;

UPDATE public.billing_subscriptions subscription
SET member_profile_id = account.member_profile_id
FROM public.billing_accounts account
WHERE subscription.billing_account_id = account.id
  AND subscription.member_profile_id IS NULL
  AND account.member_profile_id IS NOT NULL;

UPDATE public.billing_subscriptions subscription
SET member_profile_id = profile.id
FROM public.member_profiles profile
WHERE subscription.member_profile_id IS NULL
  AND subscription.user_id = profile.user_id;

CREATE OR REPLACE FUNCTION public.set_billing_subscription_member_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  linked_profile_id uuid;
BEGIN
  IF NEW.billing_account_id IS NOT NULL THEN
    SELECT member_profile_id INTO linked_profile_id
    FROM public.billing_accounts
    WHERE id = NEW.billing_account_id;

    IF linked_profile_id IS NOT NULL THEN
      NEW.member_profile_id := linked_profile_id;
    END IF;
  END IF;

  IF NEW.member_profile_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT id INTO NEW.member_profile_id
    FROM public.member_profiles
    WHERE cognito_sub = NEW.user_id::text OR user_id = NEW.user_id OR id = NEW.user_id
    ORDER BY CASE WHEN cognito_sub = NEW.user_id::text THEN 0 WHEN user_id = NEW.user_id THEN 1 ELSE 2 END
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_billing_subscription_member_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_billing_subscription_member_profile() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_billing_subscription_member_profile() TO service_role;

DROP TRIGGER IF EXISTS set_billing_subscription_member_profile ON public.billing_subscriptions;
CREATE TRIGGER set_billing_subscription_member_profile
  BEFORE INSERT OR UPDATE OF user_id, billing_account_id, member_profile_id
  ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_billing_subscription_member_profile();
CREATE INDEX IF NOT EXISTS billing_subscriptions_billing_account_id_idx
  ON public.billing_subscriptions (billing_account_id) WHERE billing_account_id IS NOT NULL;

COMMENT ON COLUMN public.billing_accounts.member_profile_id IS
  'Durable application-owned link from a Stripe customer to a portal profile.';
COMMENT ON COLUMN public.billing_subscriptions.member_profile_id IS
  'Portal profile whose currently projected Stripe subscription this row represents.';

-- Extend the service-role-only identity linker. The four-argument wrapper keeps
-- an older deployment compatible while the migration and app roll out.
DROP FUNCTION IF EXISTS public.link_billing_account_identity(text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.link_billing_account_identity(
  p_stripe_customer_id text,
  p_email text,
  p_cognito_sub text,
  p_member_profile_id uuid,
  p_reassign_identity boolean
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  normalized_customer_id text := nullif(btrim(coalesce(p_stripe_customer_id, '')), '');
  normalized_email text := lower(btrim(coalesce(p_email, '')));
  normalized_cognito_sub text := nullif(btrim(coalesce(p_cognito_sub, '')), '');
  target_account_id uuid;
  effective_member_profile_id uuid := p_member_profile_id;
  source_account record;
  profile_cognito_sub text;
BEGIN
  IF normalized_customer_id IS NULL THEN
    RAISE EXCEPTION 'stripe_customer_id is required';
  END IF;

  IF effective_member_profile_id IS NULL AND normalized_cognito_sub IS NOT NULL THEN
    SELECT id INTO effective_member_profile_id
    FROM public.member_profiles
    WHERE cognito_sub = normalized_cognito_sub;
  END IF;

  IF effective_member_profile_id IS NOT NULL THEN
    SELECT cognito_sub INTO profile_cognito_sub
    FROM public.member_profiles WHERE id = effective_member_profile_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'member_profile_id does not exist';
    END IF;
    IF normalized_cognito_sub IS NOT NULL
       AND profile_cognito_sub IS NOT NULL
       AND profile_cognito_sub <> normalized_cognito_sub THEN
      RAISE EXCEPTION 'cognito_sub does not match member_profile_id';
    END IF;
    IF normalized_cognito_sub IS NOT NULL AND profile_cognito_sub IS NULL THEN
      UPDATE public.member_profiles
      SET cognito_sub = normalized_cognito_sub, updated_at = now()
      WHERE id = effective_member_profile_id AND cognito_sub IS NULL;
    END IF;
  END IF;

  INSERT INTO public.billing_accounts (stripe_customer_id, email, updated_at)
  VALUES (normalized_customer_id, normalized_email, now())
  ON CONFLICT (stripe_customer_id) DO UPDATE
    SET email = CASE WHEN excluded.email <> '' THEN excluded.email ELSE public.billing_accounts.email END,
        updated_at = now()
  RETURNING id INTO target_account_id;

  PERFORM 1 FROM public.billing_accounts WHERE id = target_account_id FOR UPDATE;

  IF p_reassign_identity THEN
    FOR source_account IN
      SELECT id FROM public.billing_accounts
      WHERE id <> target_account_id
        AND (
          (normalized_cognito_sub IS NOT NULL AND cognito_sub = normalized_cognito_sub)
          OR (effective_member_profile_id IS NOT NULL AND member_profile_id = effective_member_profile_id)
        )
      ORDER BY id FOR UPDATE
    LOOP
      DELETE FROM public.billing_seat_invites old_invite
      WHERE old_invite.billing_account_id = source_account.id
        AND EXISTS (
          SELECT 1 FROM public.billing_seat_invites target_invite
          WHERE target_invite.billing_account_id = target_account_id
            AND lower(btrim(target_invite.email)) = lower(btrim(old_invite.email))
        );
      UPDATE public.billing_seat_invites
      SET billing_account_id = target_account_id
      WHERE billing_account_id = source_account.id;
      UPDATE public.billing_subscriptions
      SET billing_account_id = target_account_id
      WHERE billing_account_id = source_account.id;
      UPDATE public.billing_accounts
      SET cognito_sub = NULL, member_profile_id = NULL, updated_at = now()
      WHERE id = source_account.id;
    END LOOP;
  ELSIF EXISTS (
    SELECT 1 FROM public.billing_accounts
    WHERE id <> target_account_id
      AND (
        (normalized_cognito_sub IS NOT NULL AND cognito_sub = normalized_cognito_sub)
        OR (effective_member_profile_id IS NOT NULL AND member_profile_id = effective_member_profile_id)
      )
  ) THEN
    RETURN target_account_id;
  END IF;

  UPDATE public.billing_accounts
  SET cognito_sub = COALESCE(normalized_cognito_sub, cognito_sub),
      member_profile_id = COALESCE(effective_member_profile_id, member_profile_id),
      updated_at = now()
  WHERE id = target_account_id;
  RETURN target_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_billing_account_identity(
  p_stripe_customer_id text,
  p_email text DEFAULT '',
  p_cognito_sub text DEFAULT NULL,
  p_reassign_identity boolean DEFAULT false
) RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.link_billing_account_identity(
    p_stripe_customer_id, p_email, p_cognito_sub, NULL::uuid, p_reassign_identity
  );
$$;

REVOKE ALL ON FUNCTION public.link_billing_account_identity(text, text, text, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_billing_account_identity(text, text, text, uuid, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_billing_account_identity(text, text, text, uuid, boolean) TO service_role;
REVOKE ALL ON FUNCTION public.link_billing_account_identity(text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_billing_account_identity(text, text, text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_billing_account_identity(text, text, text, boolean) TO service_role;
