-- Create legacy billing accounts for subscriptions that predate billing_accounts.
INSERT INTO public.billing_accounts (stripe_customer_id, email)
SELECT DISTINCT bs.stripe_customer_id, lower(trim(mp.email))
FROM public.billing_subscriptions bs
JOIN public.member_profiles mp ON mp.user_id = bs.user_id
LEFT JOIN public.billing_accounts ba ON ba.stripe_customer_id = bs.stripe_customer_id
WHERE bs.stripe_customer_id IS NOT NULL
  AND ba.stripe_customer_id IS NULL
  AND nullif(trim(mp.email), '') IS NOT NULL
ON CONFLICT (stripe_customer_id) DO NOTHING;

UPDATE public.billing_subscriptions bs
SET billing_account_id = ba.id
FROM public.billing_accounts ba
WHERE bs.billing_account_id IS NULL
  AND bs.stripe_customer_id = ba.stripe_customer_id;
