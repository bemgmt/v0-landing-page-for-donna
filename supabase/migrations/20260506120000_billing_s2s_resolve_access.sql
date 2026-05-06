-- billing_s2s_resolve_access: unified billing lookup that checks direct
-- purchaser first, then falls back to seat-invite resolution.
-- Returns the same shape as billing_status_view plus seat_type.

CREATE OR REPLACE FUNCTION public.billing_s2s_resolve_access(p_email text)
RETURNS TABLE (
  billing_email         text,
  stripe_customer_id    text,
  stripe_subscription_id text,
  subscription_status   text,
  cancel_at_period_end  boolean,
  current_period_end    timestamptz,
  notification_emails   jsonb,
  plan                  text,
  seats_purchased       int,
  seats_allowance       int,
  source_of_truth_at    timestamptz,
  seat_type             text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm_email text := lower(trim(COALESCE(p_email, '')));
  r record;
BEGIN
  -- 1. Direct purchaser lookup
  SELECT
    bsv.billing_email,
    bsv.stripe_customer_id,
    bsv.stripe_subscription_id,
    bsv.subscription_status,
    bsv.cancel_at_period_end,
    bsv.current_period_end,
    bsv.notification_emails,
    bsv.plan,
    bsv.seats_purchased,
    bsv.seats_allowance,
    bsv.source_of_truth_at,
    'purchaser'::text AS seat_type
  INTO r
  FROM public.billing_status_view bsv
  WHERE bsv.billing_email = norm_email
  ORDER BY bsv.source_of_truth_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      r.billing_email,
      r.stripe_customer_id,
      r.stripe_subscription_id,
      r.subscription_status,
      r.cancel_at_period_end,
      r.current_period_end,
      r.notification_emails,
      r.plan,
      r.seats_purchased,
      r.seats_allowance,
      r.source_of_truth_at,
      r.seat_type;
    RETURN;
  END IF;

  -- 2. Seat invite fallback: find invite → purchaser → active subscription
  RETURN QUERY
  SELECT
    norm_email                    AS billing_email,
    NULL::text                    AS stripe_customer_id,      -- do not expose purchaser's Stripe ID
    bsv.stripe_subscription_id,
    bsv.subscription_status,
    bsv.cancel_at_period_end,
    bsv.current_period_end,
    bsv.notification_emails,
    bsv.plan,
    bsv.seats_purchased,
    bsv.seats_allowance,
    bsv.source_of_truth_at,
    'invite'::text                AS seat_type
  FROM public.billing_seat_invites si
  INNER JOIN public.billing_subscriptions bs
    ON bs.user_id = si.purchaser_user_id
  INNER JOIN public.billing_status_view bsv
    ON bsv.stripe_customer_id = bs.stripe_customer_id
  WHERE lower(trim(si.email)) = norm_email
    AND bs.status IN ('active', 'trialing')
  ORDER BY bsv.source_of_truth_at DESC
  LIMIT 1;

  -- If neither found, RETURN QUERY returns 0 rows → caller gets empty result.
END;
$$;

REVOKE ALL ON FUNCTION public.billing_s2s_resolve_access(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_s2s_resolve_access(text) TO service_role;
