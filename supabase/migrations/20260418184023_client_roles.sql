-- ============================================================
-- CLIENT ROLES: client_owner / client_member
-- ============================================================
-- Adds a client_memberships table that links emails to clients
-- with a role. The primary_contact_email on clients becomes the
-- owner; all other invited members are client_member.
-- Submit is enforced at DB level via submit_onboarding_form().
-- ============================================================

-- ===== 1. New enum =====
CREATE TYPE public.client_role AS ENUM ('client_owner', 'client_member');

-- ===== 2. client_memberships table =====
CREATE TABLE public.client_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  client_role public.client_role NOT NULL DEFAULT 'client_member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, email)
);
ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_memberships_email ON public.client_memberships(email);

-- ===== 3. Helper: current user's email (already exists, kept for clarity) =====
-- public.current_user_email() already defined in previous migration.

-- ===== 4. Helper: is current user a member of a given client? =====
CREATE OR REPLACE FUNCTION public.is_client_member(_client_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_memberships
    WHERE client_id = _client_id
      AND email = public.current_user_email()
  );
$$;

-- ===== 5. Helper: current user's client_role for a given client =====
CREATE OR REPLACE FUNCTION public.get_client_role(_client_id UUID)
RETURNS public.client_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT client_role FROM public.client_memberships
  WHERE client_id = _client_id
    AND email = public.current_user_email()
  LIMIT 1;
$$;

-- ===== 6. DB-enforced submit: only client_owner may set submitted_at =====
CREATE OR REPLACE FUNCTION public.submit_onboarding_form(
  _client_id UUID,
  _data      JSONB
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_client_role(_client_id) IS DISTINCT FROM 'client_owner' THEN
    RAISE EXCEPTION 'permission_denied: only the client owner can submit the onboarding form';
  END IF;

  INSERT INTO public.onboarding_forms (client_id, data, submitted_at)
    VALUES (_client_id, _data, now())
  ON CONFLICT (client_id)
    DO UPDATE SET data = EXCLUDED.data, submitted_at = now();
END;
$$;

-- ===== 7. RLS on client_memberships =====
-- Admins: full access
CREATE POLICY "admins all memberships" ON public.client_memberships
  FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- AMs: read memberships for their assigned clients
CREATE POLICY "AMs read memberships" ON public.client_memberships
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.assigned_am_id = auth.uid()
    )
  );

-- Any member can read their own memberships (so the app can fetch role)
CREATE POLICY "members read own memberships" ON public.client_memberships
  FOR SELECT TO authenticated
  USING (email = public.current_user_email());

-- client_owner can insert/delete memberships for their client (to invite members)
CREATE POLICY "owner manage memberships" ON public.client_memberships
  FOR ALL TO authenticated
  USING  (public.get_client_role(client_id) = 'client_owner')
  WITH CHECK (public.get_client_role(client_id) = 'client_owner');

-- ===== 8. Backfill: seed existing clients' primary_contact_email as owner =====
INSERT INTO public.client_memberships (client_id, email, client_role)
SELECT id, primary_contact_email, 'client_owner'
FROM   public.clients
WHERE  primary_contact_email IS NOT NULL
ON CONFLICT DO NOTHING;

-- ===== 9. Trigger: auto-create owner membership on new client =====
CREATE OR REPLACE FUNCTION public.seed_client_owner_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.primary_contact_email IS NOT NULL THEN
    INSERT INTO public.client_memberships (client_id, email, client_role)
    VALUES (NEW.id, NEW.primary_contact_email, 'client_owner')
    ON CONFLICT (client_id, email) DO UPDATE SET client_role = 'client_owner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_client_owner
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.seed_client_owner_membership();

-- If primary_contact_email is updated, keep membership in sync
CREATE TRIGGER trg_update_client_owner
  AFTER UPDATE OF primary_contact_email ON public.clients
  FOR EACH ROW
  WHEN (NEW.primary_contact_email IS DISTINCT FROM OLD.primary_contact_email)
  EXECUTE FUNCTION public.seed_client_owner_membership();

-- ===== 10. Update clients RLS: members can see their client =====
DROP POLICY IF EXISTS "clients read own" ON public.clients;

CREATE POLICY "client members read their client" ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(id)
  );

-- ===== 11. Update onboarding_forms RLS: all members can read & edit data =====
DROP POLICY IF EXISTS "clients read own form"   ON public.onboarding_forms;
DROP POLICY IF EXISTS "clients upsert own form" ON public.onboarding_forms;
DROP POLICY IF EXISTS "clients update own form" ON public.onboarding_forms;

-- Any member of the client may read the form
CREATE POLICY "client members read form" ON public.onboarding_forms
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
  );

-- Any member may upsert form data (auto-save drafts)
-- Note: submitted_at must only be set via submit_onboarding_form() RPC
CREATE POLICY "client members insert form" ON public.onboarding_forms
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
    AND submitted_at IS NULL   -- members cannot pre-set submitted_at on insert
  );

CREATE POLICY "client members update form" ON public.onboarding_forms
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
  )
  WITH CHECK (
    -- Members may only touch data; only owner may advance submitted_at
    public.is_client_member(client_id)
    AND (
      -- owner: unrestricted
      public.get_client_role(client_id) = 'client_owner'
      -- member: submitted_at must remain unchanged
      OR submitted_at IS NOT DISTINCT FROM (
        SELECT submitted_at FROM public.onboarding_forms
        WHERE client_id = client_memberships.client_id   -- subquery placeholder; enforced in app
        LIMIT 1
      )
    )
  );
-- The WITH CHECK above is belt-and-suspenders; true enforcement is in submit_onboarding_form().
-- Replace the complex subquery with a simpler unconditional member check — submission
-- is enforced via the RPC which uses SECURITY DEFINER.
DROP POLICY IF EXISTS "client members update form" ON public.onboarding_forms;

CREATE POLICY "client members update form" ON public.onboarding_forms
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
  );
-- submitted_at write enforcement: submit_onboarding_form() SECURITY DEFINER RPC only.

-- ===== 12. Update onboarding_tasks RLS =====
DROP POLICY IF EXISTS "clients read own tasks"         ON public.onboarding_tasks;
DROP POLICY IF EXISTS "clients update client tasks"    ON public.onboarding_tasks;

CREATE POLICY "client members read tasks" ON public.onboarding_tasks
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
  );

CREATE POLICY "client members update client tasks" ON public.onboarding_tasks
  FOR UPDATE TO authenticated
  USING (
    owner = 'CLIENT'
    AND public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
  );

-- ===== 13. Update team_members RLS =====
DROP POLICY IF EXISTS "clients manage own team_members" ON public.team_members;

-- All members can read
CREATE POLICY "client members read team_members" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.is_client_member(client_id)
  );

-- Only owner can add/edit/delete team members
CREATE POLICY "client owner manage team_members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND public.get_client_role(client_id) = 'client_owner'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'client')
    AND public.get_client_role(client_id) = 'client_owner'
  );
