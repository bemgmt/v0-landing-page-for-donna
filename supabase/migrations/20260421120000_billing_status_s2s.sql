-- S2S billing status: customers, line items, rate limit + audit tables, aggregate view, RPC.

-- -----------------------------------------------------------------------------
-- billing_customers (Stripe customer email + id)
-- -----------------------------------------------------------------------------
CREATE TABLE public.billing_customers (
  stripe_customer_id text PRIMARY KEY,
  email text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX billing_customers_email_lower_idx
  ON public.billing_customers (lower(trim(email)));

-- -----------------------------------------------------------------------------
-- billing_subscription_items (per Stripe subscription item)
-- -----------------------------------------------------------------------------
CREATE TABLE public.billing_subscription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id text NOT NULL,
  stripe_subscription_item_id text NOT NULL UNIQUE,
  quantity int NOT NULL DEFAULT 1,
  stripe_price_id text,
  price_lookup_key text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER billing_subscription_items_updated_at
  BEFORE UPDATE ON public.billing_subscription_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX billing_subscription_items_sub_id_idx
  ON public.billing_subscription_items (stripe_subscription_id);

-- -----------------------------------------------------------------------------
-- billing_subscriptions: Stripe-shaped fields for plan / seats / notifications
-- -----------------------------------------------------------------------------
ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS price_lookup_key text,
  ADD COLUMN IF NOT EXISTS notification_emails jsonb NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------------------------
-- 401 audit (Edge Function inserts via service role)
-- -----------------------------------------------------------------------------
CREATE TABLE public.billing_auth_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_ip text NOT NULL,
  path text
);

-- -----------------------------------------------------------------------------
-- Rate limit buckets (Edge Function via SECURITY DEFINER RPC)
-- -----------------------------------------------------------------------------
CREATE TABLE public.billing_s2s_rate_buckets (
  token_fingerprint text NOT NULL,
  minute_window timestamptz NOT NULL,
  request_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (token_fingerprint, minute_window)
);

CREATE OR REPLACE FUNCTION public.billing_s2s_touch_and_check(p_token_fingerprint text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mw timestamptz := date_trunc('minute', now());
  ct int;
  lim int := 60;
  retry int;
BEGIN
  INSERT INTO public.billing_s2s_rate_buckets (token_fingerprint, minute_window, request_count)
  VALUES (p_token_fingerprint, mw, 1)
  ON CONFLICT (token_fingerprint, minute_window)
  DO UPDATE SET request_count = public.billing_s2s_rate_buckets.request_count + 1
  RETURNING request_count INTO ct;

  retry := GREATEST(
    1,
    EXTRACT(epoch FROM (mw + interval '1 minute' - now()))::integer
  );

  RETURN jsonb_build_object(
    'count_after', ct,
    'exceeded', ct > lim,
    'retry_after_seconds', CASE WHEN ct > lim THEN retry ELSE 0 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.billing_s2s_touch_and_check(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_s2s_touch_and_check(text) TO service_role;

-- -----------------------------------------------------------------------------
-- billing_status_view: one row per billing email (Stripe / profile coalesced)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.billing_status_view AS
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
  ) AS source_of_truth_at
FROM public.billing_subscriptions bs
LEFT JOIN public.billing_customers bc ON bc.stripe_customer_id = bs.stripe_customer_id
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

-- -----------------------------------------------------------------------------
-- RLS: internal tables — block anon/authenticated; service_role bypasses RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_auth_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_s2s_rate_buckets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.billing_customers FROM PUBLIC;
REVOKE ALL ON public.billing_subscription_items FROM PUBLIC;
REVOKE ALL ON public.billing_auth_failures FROM PUBLIC;
REVOKE ALL ON public.billing_s2s_rate_buckets FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_customers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_subscription_items TO service_role;
GRANT SELECT, INSERT ON public.billing_auth_failures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_s2s_rate_buckets TO service_role;

REVOKE ALL ON public.billing_status_view FROM PUBLIC;
REVOKE ALL ON public.billing_status_view FROM anon, authenticated;
GRANT SELECT ON public.billing_status_view TO service_role;
