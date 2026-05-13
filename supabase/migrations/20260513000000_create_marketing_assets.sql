-- Migration to store AI-generated marketing assets (images and videos)
-- for tracking and historical lookup in the Flow Studio portal.

CREATE TABLE IF NOT EXISTS public.marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  prompt text NOT NULL,
  optimized_prompt text,
  url text NOT NULL,
  mime_type text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;

-- Policies: restricted to staff and admin roles only (consistent with generating rights)
CREATE POLICY ma_staff_select ON public.marketing_assets
  FOR SELECT TO authenticated
  USING (public.is_staff_or_admin());

CREATE POLICY ma_staff_insert ON public.marketing_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff_or_admin() 
    AND creator_profile_id = public.auth_profile_id()
  );

CREATE POLICY ma_staff_update ON public.marketing_assets
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin());

CREATE POLICY ma_staff_delete ON public.marketing_assets
  FOR DELETE TO authenticated
  USING (public.is_staff_or_admin());
