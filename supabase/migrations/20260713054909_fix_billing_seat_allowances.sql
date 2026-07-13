-- Core includes the purchaser plus two teammates; Full includes the purchaser plus five teammates.
-- Move seat ownership to the Cognito-aware billing account while retaining purchaser_user_id for rollback/legacy reads.

ALTER TABLE public.billing_seat_invites
  ADD COLUMN IF NOT EXISTS billing_account_id uuid;

UPDATE public.billing_seat_invites si
SET billing_account_id = bs.billing_account_id
FROM public.billing_subscriptions bs
WHERE si.billing_account_id IS NULL
  AND bs.user_id = si.purchaser_user_id
  AND bs.billing_account_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.billing_seat_invites WHERE billing_account_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate billing seat invites: at least one invite has no billing account';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_seat_invites_billing_account_id_fkey'
      AND conrelid = 'public.billing_seat_invites'::regclass
  ) THEN
    ALTER TABLE public.billing_seat_invites
      ADD CONSTRAINT billing_seat_invites_billing_account_id_fkey
      FOREIGN KEY (billing_account_id)
      REFERENCES public.billing_accounts(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.billing_seat_invites
  VALIDATE CONSTRAINT billing_seat_invites_billing_account_id_fkey;

ALTER TABLE public.billing_seat_invites
  ALTER COLUMN billing_account_id SET NOT NULL,
  ALTER COLUMN purchaser_user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS billing_seat_invites_billing_account_id_idx
  ON public.billing_seat_invites(billing_account_id);

CREATE UNIQUE INDEX IF NOT EXISTS billing_seat_invites_account_email_uq
  ON public.billing_seat_invites(billing_account_id, lower(trim(email)));

-- Seat mutations are authorized by NextAuth/Cognito in the server route and executed with service_role.
DROP POLICY IF EXISTS billing_seat_invites_select ON public.billing_seat_invites;
DROP POLICY IF EXISTS billing_seat_invites_insert ON public.billing_seat_invites;
DROP POLICY IF EXISTS billing_seat_invites_delete ON public.billing_seat_invites;
REVOKE ALL ON public.billing_seat_invites FROM anon, authenticated;
GRANT ALL ON public.billing_seat_invites TO service_role;

CREATE OR REPLACE VIEW public.billing_status_view WITH (security_invoker = true) AS
SELECT
  lower(trim(COALESCE(bc.email, mp.email))) AS billing_email,
  bs.stripe_customer_id,
  bs.stripe_subscription_id,
  bs.status AS subscription_status,
  bs.cancel_at_period_end,
  bs.current_period_end,
  bs.notification_emails,
  COALESCE(
    NULLIF(trim(pi.price_lookup_key), ''),
    NULLIF(trim(pi.stripe_price_id), ''),
    NULLIF(trim(bs.price_lookup_key), ''),
    NULLIF(trim(bs.stripe_price_id), ''),
    ''
  ) AS plan,
  COALESCE(si.sqty, 1)::int AS seats_purchased,
  GREATEST(
    bs.updated_at,
    COALESCE(bc.updated_at, bs.updated_at),
    COALESCE(si.iu, bs.updated_at)
  ) AS source_of_truth_at,
  CASE trim(COALESCE(
    NULLIF(trim(pi.price_lookup_key), ''),
    NULLIF(trim(pi.stripe_price_id), ''),
    NULLIF(trim(bs.price_lookup_key), ''),
    NULLIF(trim(bs.stripe_price_id), ''),
    ''
  ))
    WHEN 'core_cloud_workspace_500' THEN 3
    WHEN 'full_toolkit_1000' THEN 6
    ELSE GREATEST(COALESCE(si.sqty, 1), 1)::int
  END AS seats_allowance
FROM public.billing_subscriptions bs
LEFT JOIN public.billing_accounts bc ON bc.stripe_customer_id = bs.stripe_customer_id
LEFT JOIN public.member_profiles mp ON mp.user_id = bs.user_id
LEFT JOIN LATERAL (
  SELECT
    SUM(bsi.quantity)::bigint AS sqty,
    MAX(bsi.updated_at) AS iu
  FROM public.billing_subscription_items bsi
  WHERE bsi.stripe_subscription_id = bs.stripe_subscription_id
) si ON true
LEFT JOIN LATERAL (
  SELECT bsi2.stripe_price_id, bsi2.price_lookup_key
  FROM public.billing_subscription_items bsi2
  WHERE bsi2.stripe_subscription_id = bs.stripe_subscription_id
  ORDER BY bsi2.stripe_subscription_item_id ASC
  LIMIT 1
) pi ON true
WHERE bs.stripe_subscription_id IS NOT NULL
  AND COALESCE(bc.email, mp.email) IS NOT NULL
  AND length(trim(COALESCE(bc.email, mp.email, ''))) > 0;

REVOKE ALL ON public.billing_status_view FROM PUBLIC;
REVOKE ALL ON public.billing_status_view FROM anon, authenticated;
GRANT SELECT ON public.billing_status_view TO service_role;

CREATE OR REPLACE FUNCTION public.billing_replace_seat_invites(
  p_billing_account_id uuid,
  p_emails text[]
)
RETURNS TABLE(email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowance integer;
  normalized_emails text[];
BEGIN
  PERFORM 1
  FROM public.billing_accounts
  WHERE id = p_billing_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing account not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT bsv.seats_allowance
  INTO allowance
  FROM public.billing_subscriptions bs
  INNER JOIN public.billing_status_view bsv
    ON bsv.stripe_subscription_id = bs.stripe_subscription_id
  WHERE bs.billing_account_id = p_billing_account_id
    AND bs.status IN ('active', 'trialing')
  ORDER BY bsv.source_of_truth_at DESC
  LIMIT 1;

  IF allowance IS NULL THEN
    RAISE EXCEPTION 'No active subscription for billing account' USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(array_agg(candidate.email ORDER BY candidate.email), ARRAY[]::text[])
  INTO normalized_emails
  FROM (
    SELECT DISTINCT lower(trim(value)) AS email
    FROM unnest(COALESCE(p_emails, ARRAY[]::text[])) AS value
    WHERE length(trim(value)) > 0
  ) AS candidate;

  IF cardinality(normalized_emails) > GREATEST(allowance - 1, 0) THEN
    RAISE EXCEPTION 'Seat invite capacity exceeded: % total seats include the purchaser', allowance
      USING ERRCODE = '23514';
  END IF;

  DELETE FROM public.billing_seat_invites
  WHERE billing_account_id = p_billing_account_id;

  RETURN QUERY
  INSERT INTO public.billing_seat_invites(billing_account_id, email)
  SELECT p_billing_account_id, value
  FROM unnest(normalized_emails) AS value
  RETURNING billing_seat_invites.email, billing_seat_invites.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.billing_replace_seat_invites(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_replace_seat_invites(uuid, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_replace_seat_invites(uuid, text[]) TO service_role;
CREATE OR REPLACE FUNCTION public.billing_user_has_active_seat_invite()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.billing_seat_invites si
    INNER JOIN public.billing_subscriptions bs ON bs.billing_account_id = si.billing_account_id
    WHERE lower(trim(si.email)) = lower(trim(COALESCE(auth.jwt() ->> 'email', '')))
      AND bs.status IN ('active', 'trialing')
  );
$$;

REVOKE ALL ON FUNCTION public.billing_user_has_active_seat_invite() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_user_has_active_seat_invite() TO authenticated;

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
      ON bs.billing_account_id = si.billing_account_id
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
