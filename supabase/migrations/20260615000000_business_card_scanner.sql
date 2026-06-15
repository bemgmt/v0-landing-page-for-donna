-- Business Card Scanner: leads, shares, storage
-- Applied via Supabase CLI or SQL editor.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.business_card_leads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          text,
  company            text,
  job_title          text,
  primary_email      text,
  phone              text,
  website            text,
  event_tag          text,
  notes              text,
  ocr_markdown       text,
  extraction_model   text,
  image_storage_path text,
  scanned_by         uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  status             text NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','contacted','qualified','closed')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER business_card_leads_updated_at
  BEFORE UPDATE ON public.business_card_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.business_card_shares (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES public.business_card_leads(id) ON DELETE CASCADE,
  from_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  to_profile_id   uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, from_profile_id, to_profile_id)
);

-- -----------------------------------------------------------------------------
-- Storage bucket for card images
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', false)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.business_card_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_card_shares ENABLE ROW LEVEL SECURITY;

-- Leads: staff/admin full access
CREATE POLICY bcl_staff_all ON public.business_card_leads
  FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Leads: scanner can read own
CREATE POLICY bcl_scanner_select ON public.business_card_leads
  FOR SELECT TO authenticated
  USING (scanned_by = public.auth_profile_id());

-- Leads: partners can read leads shared to them
CREATE POLICY bcl_shared_select ON public.business_card_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_card_shares bcs
      WHERE bcs.lead_id = id
        AND bcs.to_profile_id = public.auth_profile_id()
    )
  );

-- Shares: staff/admin full access
CREATE POLICY bcs_staff_all ON public.business_card_shares
  FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Shares: sender can read own shares
CREATE POLICY bcs_sender_select ON public.business_card_shares
  FOR SELECT TO authenticated
  USING (from_profile_id = public.auth_profile_id());

-- Shares: authenticated user can insert own shares
CREATE POLICY bcs_insert_own ON public.business_card_shares
  FOR INSERT TO authenticated
  WITH CHECK (from_profile_id = public.auth_profile_id());

-- Shares: recipient can read shares sent to them
CREATE POLICY bcs_recipient_select ON public.business_card_shares
  FOR SELECT TO authenticated
  USING (to_profile_id = public.auth_profile_id());

-- Storage: staff/admin can read/write business card images
CREATE POLICY bc_storage_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'business-cards' AND public.is_staff_or_admin());

CREATE POLICY bc_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-cards' AND public.is_staff_or_admin());
