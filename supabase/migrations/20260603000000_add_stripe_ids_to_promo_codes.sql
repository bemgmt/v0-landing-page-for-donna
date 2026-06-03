-- Add Stripe identification fields to public.promo_codes table
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id text,
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text;
