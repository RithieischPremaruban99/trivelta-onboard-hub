-- ─────────────────────────────────────────────────────────────────────────────
-- RLS / helper function fixes
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Fix 1: is_assigned_am() - check by email, not just am_user_id ───────────
-- All AM assignments are stored as am_email (AMs haven't signed in yet so
-- am_user_id is NULL).  The old version only checked am_user_id = auth.uid()
-- which always returned false → AMs could see zero clients.
CREATE OR REPLACE FUNCTION public.is_assigned_am(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = _client_id
      AND (
        (cam.am_user_id IS NOT NULL AND cam.am_user_id = auth.uid())
        OR cam.am_email = public.current_user_email()
      )
  );
$$;


-- ─── Fix 2: Update every AM policy that used is_legacy_assigned_am() ─────────
-- is_legacy_assigned_am() checks clients.assigned_am_id (deprecated column,
-- always NULL for new-style clients).  Replace with is_assigned_am().

-- onboarding_forms
DROP POLICY IF EXISTS "AMs read forms of assigned"   ON public.onboarding_forms;
CREATE POLICY "AMs read forms of assigned"
  ON public.onboarding_forms FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

-- onboarding_tasks
DROP POLICY IF EXISTS "AMs read tasks of assigned"   ON public.onboarding_tasks;
CREATE POLICY "AMs read tasks of assigned"
  ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

DROP POLICY IF EXISTS "AMs update tasks of assigned" ON public.onboarding_tasks;
CREATE POLICY "AMs update tasks of assigned"
  ON public.onboarding_tasks FOR UPDATE TO authenticated
  USING (public.is_assigned_am(client_id));

-- form_submissions
DROP POLICY IF EXISTS "AMs read submissions of assigned" ON public.form_submissions;
CREATE POLICY "AMs read submissions of assigned"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

-- team_members (was using inline am_user_id = auth.uid() check)
DROP POLICY IF EXISTS "AMs (multi) read team_members" ON public.team_members;
CREATE POLICY "AMs (multi) read team_members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'account_manager'::app_role)
    AND public.is_assigned_am(client_id)
  );


-- ─── Fix 3: Members can SELECT their own team_member row by email ─────────────
-- Without this, onboarding-context.tsx can't retrieve clientRole after sign-in,
-- leaving clientRole = null → Welcome Gate doesn't redirect to the form.
CREATE POLICY "members read own team_member row"
  ON public.team_members FOR SELECT TO authenticated
  USING (email = public.current_user_email());


-- ─── Fix 4: team_members can read their client's basic record ────────────────
-- The old "client members read their client" policy used is_client_member()
-- which checks the legacy client_memberships table.  Replace with
-- is_client_team_member() (checks team_members) so magic-link members can
-- read the clients row (needed for drive_link in WelcomeInfo).
DROP POLICY IF EXISTS "client members read their client" ON public.clients;
CREATE POLICY "client members read their client"
  ON public.clients FOR SELECT TO authenticated
  USING (
    public.is_client_team_member(id)
    OR public.is_client_primary_contact(id)
  );
