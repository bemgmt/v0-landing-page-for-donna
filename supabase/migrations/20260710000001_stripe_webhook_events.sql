-- Create table for deduplicating Stripe Webhook events
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Grant privileges
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION public.project_stripe_subscription_items(
  p_stripe_subscription_id text,
  p_items jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_stripe_subscription_id, 0));

  INSERT INTO public.billing_subscription_items (
    stripe_subscription_id, stripe_subscription_item_id, quantity,
    stripe_price_id, price_lookup_key
  )
  SELECT p_stripe_subscription_id, item->>'stripe_subscription_item_id',
    COALESCE((item->>'quantity')::int, 1),
    item->>'stripe_price_id', item->>'price_lookup_key'
  FROM jsonb_array_elements(p_items) item
  ON CONFLICT (stripe_subscription_item_id) DO UPDATE SET
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    quantity = EXCLUDED.quantity,
    stripe_price_id = EXCLUDED.stripe_price_id,
    price_lookup_key = EXCLUDED.price_lookup_key;

  DELETE FROM public.billing_subscription_items existing
  WHERE existing.stripe_subscription_id = p_stripe_subscription_id
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_items) item
      WHERE item->>'stripe_subscription_item_id' = existing.stripe_subscription_item_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.project_stripe_subscription_items(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_stripe_subscription_items(text, jsonb) TO service_role;
