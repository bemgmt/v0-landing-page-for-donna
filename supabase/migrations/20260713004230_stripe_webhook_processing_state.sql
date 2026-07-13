-- Retryable Stripe webhook processing state.
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS attempt_count integer,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.stripe_webhook_events
SET status = COALESCE(status, 'completed'),
    attempt_count = COALESCE(attempt_count, 1),
    completed_at = COALESCE(completed_at, created_at),
    updated_at = COALESCE(updated_at, created_at);

ALTER TABLE public.stripe_webhook_events
  ALTER COLUMN status SET DEFAULT 'processing',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN attempt_count SET DEFAULT 1,
  ALTER COLUMN attempt_count SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stripe_webhook_events_status_check'
      AND conrelid = 'public.stripe_webhook_events'::regclass
  ) THEN
    ALTER TABLE public.stripe_webhook_events
      ADD CONSTRAINT stripe_webhook_events_status_check
      CHECK (status IN ('processing', 'completed', 'failed'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_stripe_event_id text,
  p_event_type text,
  p_stale_after_seconds integer DEFAULT 300
) RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  was_inserted boolean := false;
  existing_status text;
  existing_updated_at timestamptz;
BEGIN
  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, status, attempt_count, updated_at
  ) VALUES (
    p_stripe_event_id, p_event_type, 'processing', 1, now()
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING true INTO was_inserted;

  IF was_inserted THEN
    RETURN 'claimed';
  END IF;

  SELECT status, updated_at
  INTO existing_status, existing_updated_at
  FROM public.stripe_webhook_events
  WHERE stripe_event_id = p_stripe_event_id
  FOR UPDATE;

  IF existing_status = 'completed' THEN
    RETURN 'completed';
  END IF;

  IF existing_status = 'processing'
     AND existing_updated_at > now() - make_interval(secs => greatest(p_stale_after_seconds, 30)) THEN
    RETURN 'processing';
  END IF;

  UPDATE public.stripe_webhook_events
  SET event_type = p_event_type,
      status = 'processing',
      attempt_count = attempt_count + 1,
      last_error = NULL,
      updated_at = now()
  WHERE stripe_event_id = p_stripe_event_id;

  RETURN 'claimed';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, integer) TO service_role;
