-- Repair the application-owned Stripe projection and secure legacy reporting views.

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id text,
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text;

CREATE OR REPLACE FUNCTION public.link_billing_account_identity(
  p_stripe_customer_id text,
  p_email text DEFAULT '',
  p_cognito_sub text DEFAULT NULL,
  p_reassign_identity boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  normalized_customer_id text := nullif(trim(coalesce(p_stripe_customer_id, '')), '');
  normalized_email text := lower(trim(coalesce(p_email, '')));
  normalized_cognito_sub text := nullif(trim(coalesce(p_cognito_sub, '')), '');
  target_account_id uuid;
  previous_account_id uuid;
BEGIN
  IF normalized_customer_id IS NULL THEN
    RAISE EXCEPTION 'stripe_customer_id is required';
  END IF;

  INSERT INTO public.billing_accounts (stripe_customer_id, email, updated_at)
  VALUES (normalized_customer_id, normalized_email, now())
  ON CONFLICT (stripe_customer_id) DO UPDATE
    SET email = CASE
          WHEN excluded.email <> '' THEN excluded.email
          ELSE public.billing_accounts.email
        END,
        updated_at = now()
  RETURNING id INTO target_account_id;

  IF normalized_cognito_sub IS NULL THEN
    RETURN target_account_id;
  END IF;

  SELECT id INTO previous_account_id
  FROM public.billing_accounts
  WHERE cognito_sub = normalized_cognito_sub
  FOR UPDATE;

  IF previous_account_id IS NULL OR previous_account_id = target_account_id THEN
    UPDATE public.billing_accounts
    SET cognito_sub = normalized_cognito_sub,
        updated_at = now()
    WHERE id = target_account_id;
    RETURN target_account_id;
  END IF;

  IF NOT p_reassign_identity THEN
    RETURN target_account_id;
  END IF;

  DELETE FROM public.billing_seat_invites old_invite
  WHERE old_invite.billing_account_id = previous_account_id
    AND EXISTS (
      SELECT 1
      FROM public.billing_seat_invites target_invite
      WHERE target_invite.billing_account_id = target_account_id
        AND lower(trim(target_invite.email)) = lower(trim(old_invite.email))
    );

  UPDATE public.billing_seat_invites
  SET billing_account_id = target_account_id
  WHERE billing_account_id = previous_account_id;

  UPDATE public.billing_accounts
  SET cognito_sub = NULL,
      updated_at = now()
  WHERE id = previous_account_id;

  UPDATE public.billing_accounts
  SET cognito_sub = normalized_cognito_sub,
      updated_at = now()
  WHERE id = target_account_id;

  RETURN target_account_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_billing_account_identity(text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_billing_account_identity(text, text, text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_billing_account_identity(text, text, text, boolean) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.user_activity_summary') IS NOT NULL THEN
    ALTER VIEW public.user_activity_summary SET (security_invoker = true);
    REVOKE ALL ON public.user_activity_summary FROM anon, authenticated;
    GRANT SELECT ON public.user_activity_summary TO service_role;
  END IF;

  IF to_regclass('public.recent_chat_activity') IS NOT NULL THEN
    ALTER VIEW public.recent_chat_activity SET (security_invoker = true);
    REVOKE ALL ON public.recent_chat_activity FROM anon, authenticated;
    GRANT SELECT ON public.recent_chat_activity TO service_role;
  END IF;
END;
$$;
