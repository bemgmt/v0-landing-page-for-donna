-- DONNA portal core schema (Supabase Auth). Apply via Supabase CLI or SQL editor.

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.role_rank(r text)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE r
    WHEN 'free_member' THEN 1
    WHEN 'partner' THEN 2
    WHEN 'staff' THEN 3
    WHEN 'admin' THEN 4
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Profiles & billing
-- -----------------------------------------------------------------------------
CREATE TABLE public.member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL DEFAULT 'free_member' CHECK (role IN ('free_member','partner','staff','admin')),
  display_name text,
  email text,
  avatar_url text,
  company_name text,
  bio text,
  phone text,
  website_url text,
  partner_via_stripe boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER member_profiles_updated_at
  BEFORE UPDATE ON public.member_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS helpers referencing member_profiles (must run AFTER member_profiles exists)
CREATE OR REPLACE FUNCTION public.auth_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.member_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE user_id = auth.uid() AND role IN ('staff','admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.member_can_access_doc(min_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles mp
    WHERE mp.user_id = auth.uid()
      AND mp.is_active = true
      AND public.role_rank(mp.role) >= public.role_rank(min_role)
  );
$$;

CREATE TABLE public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.member_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Sales & leads
-- -----------------------------------------------------------------------------
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  share_slug text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  partner_profile_id uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  external_sale_id text,
  customer_name text,
  customer_email text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  attribution_source text NOT NULL DEFAULT 'promo_code' CHECK (attribution_source IN ('promo_code','manual_claim','round_robin','admin')),
  sale_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sales_external_sale_id_uq ON public.sales (external_sale_id) WHERE external_sale_id IS NOT NULL;

CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sale_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  claimant_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  evidence_notes text,
  evidence_file_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER sale_claims_updated_at
  BEFORE UPDATE ON public.sale_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name text,
  lead_email text,
  lead_phone text,
  notes text,
  status text NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed','assigned','claimed','closed')),
  assigned_partner_id uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER lead_pool_updated_at
  BEFORE UPDATE ON public.lead_pool
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.round_robin_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name text NOT NULL UNIQUE,
  current_partner_id uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  current_index integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Documents & social
-- -----------------------------------------------------------------------------
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  storage_path text NOT NULL,
  mime_type text,
  min_role text NOT NULL DEFAULT 'free_member' CHECK (min_role IN ('free_member','partner','staff','admin')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- Forum
-- -----------------------------------------------------------------------------
CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body_md text NOT NULL DEFAULT '',
  is_pinned boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  body_md text NOT NULL DEFAULT '',
  is_staff_answer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER forum_replies_updated_at
  BEFORE UPDATE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Chat & presence
-- -----------------------------------------------------------------------------
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ai' CHECK (status IN ('ai','waiting_for_staff','live','closed')),
  staff_profile_id uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  requested_human boolean NOT NULL DEFAULT false,
  capability_mode boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','staff','system')),
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.staff_presence (
  profile_id uuid PRIMARY KEY REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  availability text NOT NULL DEFAULT 'offline' CHECK (availability IN ('online','away','offline')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Audit
-- -----------------------------------------------------------------------------
CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Storage bucket (private documents)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-documents', 'portal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_robin_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- member_profiles
CREATE POLICY mp_select_own_or_staff ON public.member_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin());

CREATE POLICY mp_update_own ON public.member_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY mp_admin_update ON public.member_profiles FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- billing: own row read; writes via service role / webhook only
CREATE POLICY billing_select_own ON public.billing_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- promo_codes: partner owns; staff sees all
CREATE POLICY promo_select ON public.promo_codes FOR SELECT TO authenticated
  USING (
    partner_profile_id = public.auth_profile_id()
    OR public.is_staff_or_admin()
  );

CREATE POLICY promo_manage_staff ON public.promo_codes FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- sales
CREATE POLICY sales_partner_select ON public.sales FOR SELECT TO authenticated
  USING (
    partner_profile_id = public.auth_profile_id()
    OR public.is_staff_or_admin()
  );

CREATE POLICY sales_staff_write ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin());

CREATE POLICY sales_staff_update ON public.sales FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin());

-- sale_claims
CREATE POLICY claims_select ON public.sale_claims FOR SELECT TO authenticated
  USING (
    claimant_profile_id = public.auth_profile_id()
    OR public.is_staff_or_admin()
  );

CREATE POLICY claims_insert_partner ON public.sale_claims FOR INSERT TO authenticated
  WITH CHECK (claimant_profile_id = public.auth_profile_id());

CREATE POLICY claims_staff_update ON public.sale_claims FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin());

-- leads
CREATE POLICY leads_partner_select ON public.lead_pool FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.member_profiles mp WHERE mp.user_id = auth.uid() AND mp.role IN ('partner','staff','admin'))
  );

CREATE POLICY leads_staff_all ON public.lead_pool FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- round_robin_state: partners read; staff write
CREATE POLICY rr_read ON public.round_robin_state FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.member_profiles mp WHERE mp.user_id = auth.uid() AND mp.role IN ('partner','staff','admin'))
  );

CREATE POLICY rr_staff_write ON public.round_robin_state FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- documents: read if role meets min_role
CREATE POLICY documents_read ON public.documents FOR SELECT TO authenticated
  USING (is_active = true AND public.member_can_access_doc(min_role));

CREATE POLICY documents_staff_write ON public.documents FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- social_links: readable by authenticated members
CREATE POLICY social_read ON public.social_links FOR SELECT TO authenticated
  USING (is_active = true OR public.is_staff_or_admin());

CREATE POLICY social_staff ON public.social_links FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- forum categories
CREATE POLICY forum_cat_read ON public.forum_categories FOR SELECT TO authenticated
  USING (is_active = true OR public.is_staff_or_admin());

CREATE POLICY forum_cat_staff ON public.forum_categories FOR ALL TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- forum posts
CREATE POLICY forum_posts_read ON public.forum_posts FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR author_profile_id = public.auth_profile_id()
    OR public.is_staff_or_admin()
  );

CREATE POLICY forum_posts_insert ON public.forum_posts FOR INSERT TO authenticated
  WITH CHECK (author_profile_id = public.auth_profile_id());

CREATE POLICY forum_posts_update_own ON public.forum_posts FOR UPDATE TO authenticated
  USING (author_profile_id = public.auth_profile_id() OR public.is_staff_or_admin());

-- forum replies
CREATE POLICY forum_rep_read ON public.forum_replies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts p WHERE p.id = post_id AND (
        p.status = 'published' OR p.author_profile_id = public.auth_profile_id() OR public.is_staff_or_admin()
      )
    )
  );

CREATE POLICY forum_rep_insert ON public.forum_replies FOR INSERT TO authenticated
  WITH CHECK (author_profile_id = public.auth_profile_id());

CREATE POLICY forum_rep_update ON public.forum_replies FOR UPDATE TO authenticated
  USING (author_profile_id = public.auth_profile_id() OR public.is_staff_or_admin());

-- chat
CREATE POLICY chat_sess_member ON public.chat_sessions FOR SELECT TO authenticated
  USING (member_profile_id = public.auth_profile_id() OR public.is_staff_or_admin());

CREATE POLICY chat_sess_insert ON public.chat_sessions FOR INSERT TO authenticated
  WITH CHECK (member_profile_id = public.auth_profile_id());

CREATE POLICY chat_sess_update ON public.chat_sessions FOR UPDATE TO authenticated
  USING (member_profile_id = public.auth_profile_id() OR public.is_staff_or_admin());

CREATE POLICY chat_msg_read ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = session_id AND (
        s.member_profile_id = public.auth_profile_id() OR public.is_staff_or_admin()
      )
    )
  );

CREATE POLICY chat_msg_insert ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = session_id AND (
        s.member_profile_id = public.auth_profile_id() OR public.is_staff_or_admin()
      )
    )
  );

-- staff presence
CREATE POLICY presence_read ON public.staff_presence FOR SELECT TO authenticated
  USING (true);

CREATE POLICY presence_write_own ON public.staff_presence FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = public.auth_profile_id() AND EXISTS (
      SELECT 1 FROM public.member_profiles mp WHERE mp.id = profile_id AND mp.role IN ('staff','admin')
    )
  );

CREATE POLICY presence_update_own ON public.staff_presence FOR UPDATE TO authenticated
  USING (profile_id = public.auth_profile_id());

-- audit: staff only
CREATE POLICY audit_staff ON public.audit_events FOR SELECT TO authenticated
  USING (public.is_staff_or_admin());

CREATE POLICY audit_staff_insert ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin());

-- Storage policies
CREATE POLICY portal_docs_read ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'portal-documents'
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.storage_path = objects.name
        AND d.is_active = true
        AND public.member_can_access_doc(d.min_role)
    )
  );

CREATE POLICY portal_docs_staff_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portal-documents'
    AND public.is_staff_or_admin()
  );

CREATE POLICY portal_docs_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portal-documents' AND public.is_staff_or_admin());

CREATE POLICY portal_docs_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portal-documents' AND public.is_staff_or_admin());

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------
INSERT INTO public.forum_categories (slug, title, description)
VALUES
  ('ideas', 'Ideas', 'Product and community ideas'),
  ('sales-questions', 'Sales questions', 'Partner and sales topics')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.social_links (platform, label, url, sort_order)
SELECT 'linkedin', 'DONNA on LinkedIn', 'https://www.linkedin.com', 1
WHERE NOT EXISTS (SELECT 1 FROM public.social_links WHERE platform = 'linkedin');

INSERT INTO public.social_links (platform, label, url, sort_order)
SELECT 'youtube', 'DONNA on YouTube', 'https://www.youtube.com', 2
WHERE NOT EXISTS (SELECT 1 FROM public.social_links WHERE platform = 'youtube');

INSERT INTO public.round_robin_state (queue_name, current_index)
VALUES ('default', 0)
ON CONFLICT (queue_name) DO NOTHING;

INSERT INTO public.documents (title, description, category, storage_path, mime_type, min_role, sort_order)
SELECT 'Welcome packet', 'Orientation PDF (placeholder path — replace after upload)', 'onboarding', 'seed/welcome.pdf', 'application/pdf', 'free_member', 1
WHERE NOT EXISTS (SELECT 1 FROM public.documents WHERE storage_path = 'seed/welcome.pdf');

INSERT INTO public.lead_pool (lead_name, lead_email, status, source)
SELECT 'Demo Lead', 'lead@example.com', 'unclaimed', 'seed'
WHERE NOT EXISTS (SELECT 1 FROM public.lead_pool WHERE lead_email = 'lead@example.com');
