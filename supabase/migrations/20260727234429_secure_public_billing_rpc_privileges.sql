-- Remove Data API access from privileged billing helpers.
--
-- billing-status and the Cognito/NextAuth seat routes call these operations
-- server-side with service_role. Supabase's explicit default grants to anon
-- and authenticated survived the earlier PUBLIC-only revokes, leaving the
-- SECURITY DEFINER functions callable through /rest/v1/rpc.

REVOKE ALL PRIVILEGES
  ON FUNCTION public.billing_s2s_touch_and_check(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.billing_s2s_touch_and_check(text)
  TO service_role;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.billing_s2s_resolve_access(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.billing_s2s_resolve_access(text)
  TO service_role;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.billing_s2s_resolve_access(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.billing_s2s_resolve_access(text, text)
  TO service_role;

-- This legacy Supabase-JWT helper is no longer called by the Cognito-aware
-- application. Seat access is resolved server-side via billing-status.
REVOKE ALL PRIVILEGES
  ON FUNCTION public.billing_user_has_active_seat_invite()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
  ON FUNCTION public.billing_user_has_active_seat_invite()
  TO service_role;

-- Fail the migration atomically if any target remains exposed or if the
-- server-side role needed by billing-status and seat management loses access.
DO $$
DECLARE
  target regprocedure;
  targets regprocedure[] := ARRAY[
    'public.billing_s2s_touch_and_check(text)'::regprocedure,
    'public.billing_s2s_resolve_access(text)'::regprocedure,
    'public.billing_s2s_resolve_access(text,text)'::regprocedure,
    'public.billing_user_has_active_seat_invite()'::regprocedure
  ];
BEGIN
  FOREACH target IN ARRAY targets LOOP
    IF has_function_privilege('anon', target::oid, 'EXECUTE')
       OR has_function_privilege('authenticated', target::oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'Privileged billing function remains publicly executable: %', target;
    END IF;

    IF NOT has_function_privilege('service_role', target::oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role cannot execute required billing function: %', target;
    END IF;
  END LOOP;
END
$$;
