-- Create auth_diagnostics table for storing auth-related logs safely
CREATE TABLE public.auth_diagnostics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    event_name text NOT NULL,
    correlation_id text,
    environment text NOT NULL,
    is_success boolean NOT NULL,
    error_message text,
    endpoint text,
    has_session boolean,
    has_access_token boolean,
    has_authorization_header boolean,
    redirect_host text,
    cognito_client_id text,
    subject_hash text
);

-- Protect table with RLS
ALTER TABLE public.auth_diagnostics ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anon (via server logic if needed) or just admin.
-- Since this is populated by server-side routes using admin/service key, we can leave it restrictive.
-- Service role key bypasses RLS, so no policies are needed for insertion.
