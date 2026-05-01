-- Ops email dedupe: one notify per Stripe subscription id (resubscribe with new sub id notifies again).
ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS ops_subscribe_notified_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS ops_subscribe_notified_stripe_subscription_id text NULL;

COMMENT ON COLUMN public.billing_subscriptions.ops_subscribe_notified_at IS
  'When internal ops email was last sent for a new/changed paid subscription.';
COMMENT ON COLUMN public.billing_subscriptions.ops_subscribe_notified_stripe_subscription_id IS
  'Stripe subscription id last reported to ops; distinct from current row stripe_subscription_id triggers another notify.';
