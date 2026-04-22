-- Seat invites (portal-managed) + seats_allowance on billing_status_view.

-- -----------------------------------------------------------------------------
-- billing_seat_invites: purchaser assigns emails up to plan allowance
-- -----------------------------------------------------------------------------
CREATE TABLE public.billing_seat_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_user_id uuid NOT NULL REFERENCES public.billing_subscriptions (user_id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX billing_seat_invites_purchaser_email_uq
  ON public.billing_seat_invites (purchaser_user_id, lower(trim(email)));

CREATE INDEX billing_seat_invites_purchaser_idx
  ON public.billing_seat_invites (purchaser_user_id);

CREATE INDEX billing_seat_invites_email_lower_idx
  ON public.billing_seat_invites (lower(trim(email)));

ALTER TABLE public.billing_seat_invites ENABLE ROW LEVEL SECURITY;

-- Purchasers manage their list; invitees can read rows that match their sign-in email.
CREATE POLICY billing_seat_invites_select ON public.billing_seat_invites
  FOR SELECT TO authenticated
  USING (
    purchaser_user_id = auth.uid()
    OR lower(trim(email)) = lower(trim(COALESCE((auth.jwt() ->> 'email')::text, '')))
  );

CREATE POLICY billing_seat_invites_insert ON public.billing_seat_invites
  FOR INSERT TO authenticated
  WITH CHECK (purchaser_user_id = auth.uid());

CREATE POLICY billing_seat_invites_delete ON public.billing_seat_invites
  FOR DELETE TO authenticated
  USING (purchaser_user_id = auth.uid());

REVOKE ALL ON public.billing_seat_invites FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.billing_seat_invites TO authenticated;
GRANT ALL ON public.billing_seat_invites TO service_role;

-- -----------------------------------------------------------------------------
-- billing_status_view: add seats_allowance (included seats per lookup_key)
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
  ) AS source_of_truth_at,
  CASE trim(COALESCE(
    NULLIF(trim(pi.price_lookup_key), ''),
    NULLIF(trim(pi.stripe_price_id), ''),
    NULLIF(trim(bs.price_lookup_key), ''),
    NULLIF(trim(bs.stripe_price_id), ''),
    ''
  ))
    WHEN 'core_cloud_workspace_500' THEN 2
    WHEN 'full_toolkit_1000' THEN 6
    ELSE GREATEST(COALESCE(si.sqty, 1), 1)::int
  END AS seats_allowance
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

REVOKE ALL ON public.billing_status_view FROM PUBLIC;
REVOKE ALL ON public.billing_status_view FROM anon, authenticated;
GRANT SELECT ON public.billing_status_view TO service_role;

-- -----------------------------------------------------------------------------
-- RPC: current user has an invite on an active/trialing subscription
-- -----------------------------------------------------------------------------
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
    INNER JOIN public.billing_subscriptions bs ON bs.user_id = si.purchaser_user_id
    WHERE lower(trim(si.email)) = lower(trim(COALESCE(auth.jwt() ->> 'email', '')))
      AND bs.status IN ('active', 'trialing')
  );
$$;

REVOKE ALL ON FUNCTION public.billing_user_has_active_seat_invite() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_user_has_active_seat_invite() TO authenticated;
