-- Cognito-authoritative billing identity with legacy email fallback.
ALTER TABLE public.billing_accounts
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE public.billing_accounts SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE public.billing_accounts ALTER COLUMN id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS billing_accounts_id_key ON public.billing_accounts(id);

DROP INDEX IF EXISTS public.billing_accounts_cognito_sub_key;
CREATE UNIQUE INDEX IF NOT EXISTS billing_accounts_cognito_sub_idx
  ON public.billing_accounts(cognito_sub)
  WHERE cognito_sub IS NOT NULL;

ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS billing_account_id uuid;

UPDATE public.billing_subscriptions bs
SET billing_account_id = ba.id
FROM public.billing_accounts ba
WHERE bs.billing_account_id IS NULL
  AND bs.stripe_customer_id = ba.stripe_customer_id;

CREATE INDEX IF NOT EXISTS billing_subscriptions_billing_account_id_idx
  ON public.billing_subscriptions(billing_account_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_subscriptions_billing_account_id_fkey'
      AND conrelid = 'public.billing_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.billing_subscriptions
      ADD CONSTRAINT billing_subscriptions_billing_account_id_fkey
      FOREIGN KEY (billing_account_id)
      REFERENCES public.billing_accounts(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.billing_subscriptions
  VALIDATE CONSTRAINT billing_subscriptions_billing_account_id_fkey;

CREATE OR REPLACE FUNCTION public.billing_s2s_resolve_access(
  p_cognito_sub text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS TABLE(
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  cancel_at_period_end boolean,
  current_period_end timestamptz,
  notification_emails jsonb,
  plan text,
  seats_purchased integer,
  seats_allowance integer,
  source_of_truth_at timestamptz,
  seat_type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm_sub text := nullif(trim(coalesce(p_cognito_sub, '')), '');
  norm_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  account_row public.billing_accounts%ROWTYPE;
  r record;
BEGIN
  IF norm_sub IS NOT NULL THEN
    SELECT * INTO account_row
    FROM public.billing_accounts ba
    WHERE ba.cognito_sub = norm_sub
    LIMIT 1;
  END IF;

  IF account_row.stripe_customer_id IS NULL AND norm_email IS NOT NULL THEN
    SELECT * INTO account_row
    FROM public.billing_accounts ba
    WHERE lower(trim(ba.email)) = norm_email
    ORDER BY ba.updated_at DESC
    LIMIT 1;
  END IF;

  IF account_row.stripe_customer_id IS NOT NULL THEN
    SELECT
      bsv.billing_email, bsv.stripe_customer_id, bsv.stripe_subscription_id,
      bsv.subscription_status, bsv.cancel_at_period_end, bsv.current_period_end,
      bsv.notification_emails, bsv.plan, bsv.seats_purchased,
      bsv.seats_allowance, bsv.source_of_truth_at, 'purchaser'::text AS seat_type
    INTO r
    FROM public.billing_status_view bsv
    WHERE bsv.stripe_customer_id = account_row.stripe_customer_id
    ORDER BY bsv.source_of_truth_at DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN QUERY SELECT r.billing_email, r.stripe_customer_id,
        r.stripe_subscription_id, r.subscription_status,
        r.cancel_at_period_end, r.current_period_end,
        r.notification_emails, r.plan, r.seats_purchased,
        r.seats_allowance, r.source_of_truth_at, r.seat_type;
      RETURN;
    END IF;
  END IF;

  IF norm_email IS NOT NULL THEN
    RETURN QUERY
    SELECT norm_email, NULL::text, bsv.stripe_subscription_id,
      bsv.subscription_status, bsv.cancel_at_period_end,
      bsv.current_period_end, bsv.notification_emails, bsv.plan,
      bsv.seats_purchased, bsv.seats_allowance, bsv.source_of_truth_at,
      'invite'::text
    FROM public.billing_seat_invites si
    INNER JOIN public.billing_subscriptions bs
      ON bs.user_id = si.purchaser_user_id
    INNER JOIN public.billing_status_view bsv
      ON bsv.stripe_customer_id = bs.stripe_customer_id
    WHERE lower(trim(si.email)) = norm_email
      AND bs.status IN ('active', 'trialing')
    ORDER BY bsv.source_of_truth_at DESC
    LIMIT 1;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.billing_s2s_resolve_access(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_s2s_resolve_access(text, text) TO service_role;
