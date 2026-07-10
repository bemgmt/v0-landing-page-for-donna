-- Create table for deduplicating Stripe Webhook events
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Grant privileges
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
