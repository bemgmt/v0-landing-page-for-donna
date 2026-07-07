-- Unify member_profiles data into donna_drive_members

CREATE OR REPLACE FUNCTION public.sync_member_to_drive_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We only update existing records in DONNA Drive to avoid assuming an org_id
  -- for users who haven't started a simulation.
  UPDATE public.donna_drive_members
  SET 
    display_name = NEW.display_name,
    email = NEW.email,
    company = NEW.company_name,
    phone = NEW.phone
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_member_to_drive_member ON public.member_profiles;
CREATE TRIGGER trg_sync_member_to_drive_member
AFTER UPDATE OF display_name, email, company_name, phone ON public.member_profiles
FOR EACH ROW
WHEN (
  OLD.display_name IS DISTINCT FROM NEW.display_name OR
  OLD.email IS DISTINCT FROM NEW.email OR
  OLD.company_name IS DISTINCT FROM NEW.company_name OR
  OLD.phone IS DISTINCT FROM NEW.phone
)
EXECUTE FUNCTION public.sync_member_to_drive_member();
