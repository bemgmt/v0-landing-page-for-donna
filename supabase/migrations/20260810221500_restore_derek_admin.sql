-- Restore the portal owner's profile after it was accidentally deleted.
-- Cognito identities do not have a corresponding auth.users row, so recover
-- the profile only from an unambiguous existing Cognito billing identity.
DO $$
DECLARE
  owner_profile_id uuid;
  owner_cognito_sub text;
BEGIN
  SELECT id
  INTO owner_profile_id
  FROM public.member_profiles
  WHERE lower(btrim(email)) = 'derek@aidonna.co'
  ORDER BY created_at
  LIMIT 1;

  IF owner_profile_id IS NULL THEN
    SELECT min(cognito_sub)
    INTO owner_cognito_sub
    FROM public.billing_accounts
    WHERE lower(btrim(email)) = 'derek@aidonna.co'
      AND cognito_sub IS NOT NULL
    HAVING count(DISTINCT cognito_sub) = 1;

    IF owner_cognito_sub IS NOT NULL THEN
      INSERT INTO public.member_profiles (
        user_id,
        cognito_sub,
        email,
        display_name,
        role,
        is_active
      )
      VALUES (
        NULL,
        owner_cognito_sub,
        'derek@aidonna.co',
        'Derek',
        'admin',
        true
      );
    ELSE
      RAISE NOTICE 'Owner profile will be recreated on the next authenticated portal login';
    END IF;
  ELSE
    UPDATE public.member_profiles
    SET role = 'admin', is_active = true
    WHERE id = owner_profile_id;
  END IF;
END;
$$;
