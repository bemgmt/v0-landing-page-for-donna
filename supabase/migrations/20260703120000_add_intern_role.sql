-- Add intern role

CREATE OR REPLACE FUNCTION public.role_rank(r text)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE r
    WHEN 'free_member' THEN 1
    WHEN 'intern' THEN 2
    WHEN 'partner' THEN 3
    WHEN 'staff' THEN 4
    WHEN 'admin' THEN 5
    ELSE 0
  END;
$$;

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_role_check;
ALTER TABLE public.member_profiles ADD CONSTRAINT member_profiles_role_check CHECK (role IN ('free_member','intern','partner','staff','admin'));

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_min_role_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_min_role_check CHECK (min_role IN ('free_member','intern','partner','staff','admin'));
