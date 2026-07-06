-- Add intern_tasks JSONB column to member_profiles
ALTER TABLE public.member_profiles
ADD COLUMN IF NOT EXISTS intern_tasks JSONB DEFAULT '{}'::jsonb;
