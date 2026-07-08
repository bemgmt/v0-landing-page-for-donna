-- Rename billing_customers to billing_accounts if it hasn't been done already
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'billing_customers') THEN
    ALTER TABLE public.billing_customers RENAME TO billing_accounts;
  END IF;
END $$;

-- Add cognito_sub
ALTER TABLE public.billing_accounts ADD COLUMN IF NOT EXISTS cognito_sub TEXT;

-- Add unique index for cognito_sub
CREATE UNIQUE INDEX IF NOT EXISTS billing_accounts_cognito_sub_idx ON public.billing_accounts(cognito_sub) WHERE cognito_sub IS NOT NULL;
