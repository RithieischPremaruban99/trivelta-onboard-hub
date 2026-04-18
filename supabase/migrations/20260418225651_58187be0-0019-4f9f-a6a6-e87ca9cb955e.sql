-- Helper: is the current AM (multi) assigned to the client?
CREATE OR REPLACE FUNCTION public.is_assigned_am(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = _client_id AND cam.am_user_id = auth.uid()
  );
$$;

-- Helper: is the current user the primary contact for the client?
CREATE OR REPLACE FUNCTION public.is_client_primary_contact(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = _client_id AND c.primary_contact_email = public.current_user_email()
  );
$$;

-- Helper: is current user the single assigned_am_id for client?
CREATE OR REPLACE FUNCTION public.is_legacy_assigned_am(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = _client_id AND c.assigned_am_id = auth.uid()
  );
$$;

-- ====== clients table: rewrite policies that recurse via client_account_managers ======
DROP POLICY IF EXISTS "AMs (multi) read assigned clients" ON public.clients;
CREATE POLICY "AMs (multi) read assigned clients"
  ON public.clients FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND public.is_assigned_am(id));

DROP POLICY IF EXISTS "AMs (multi) update assigned clients" ON public.clients;
CREATE POLICY "AMs (multi) update assigned clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND public.is_assigned_am(id));

-- ====== client_account_managers: stop selecting from clients ======
DROP POLICY IF EXISTS "Clients read own client_ams" ON public.client_account_managers;
CREATE POLICY "Clients read own client_ams"
  ON public.client_account_managers FOR SELECT TO authenticated
  USING (public.is_client_primary_contact(client_id));

-- ====== form_submissions ======
DROP POLICY IF EXISTS "AMs read submissions of assigned" ON public.form_submissions;
CREATE POLICY "AMs read submissions of assigned"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (public.is_legacy_assigned_am(client_id));

-- ====== onboarding_forms ======
DROP POLICY IF EXISTS "AMs read forms of assigned" ON public.onboarding_forms;
CREATE POLICY "AMs read forms of assigned"
  ON public.onboarding_forms FOR SELECT TO authenticated
  USING (public.is_legacy_assigned_am(client_id));

DROP POLICY IF EXISTS "team members read form" ON public.onboarding_forms;
CREATE POLICY "team members read form"
  ON public.onboarding_forms FOR SELECT TO authenticated
  USING (is_client_team_member(client_id) OR public.is_client_primary_contact(client_id));

DROP POLICY IF EXISTS "team members update form fields" ON public.onboarding_forms;
CREATE POLICY "team members update form fields"
  ON public.onboarding_forms FOR UPDATE TO authenticated
  USING (is_client_team_member(client_id) OR public.is_client_primary_contact(client_id));

DROP POLICY IF EXISTS "team members upsert form" ON public.onboarding_forms;
CREATE POLICY "team members upsert form"
  ON public.onboarding_forms FOR INSERT TO authenticated
  WITH CHECK (is_client_team_member(client_id) OR public.is_client_primary_contact(client_id));

-- ====== onboarding_tasks ======
DROP POLICY IF EXISTS "AMs read tasks of assigned" ON public.onboarding_tasks;
CREATE POLICY "AMs read tasks of assigned"
  ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_legacy_assigned_am(client_id));

DROP POLICY IF EXISTS "AMs update tasks of assigned" ON public.onboarding_tasks;
CREATE POLICY "AMs update tasks of assigned"
  ON public.onboarding_tasks FOR UPDATE TO authenticated
  USING (public.is_legacy_assigned_am(client_id));

DROP POLICY IF EXISTS "clients read own tasks" ON public.onboarding_tasks;
CREATE POLICY "clients read own tasks"
  ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_client_primary_contact(client_id));

DROP POLICY IF EXISTS "clients update client tasks" ON public.onboarding_tasks;
CREATE POLICY "clients update client tasks"
  ON public.onboarding_tasks FOR UPDATE TO authenticated
  USING (owner = 'CLIENT' AND public.is_client_primary_contact(client_id));

-- ====== team_members ======
DROP POLICY IF EXISTS "AMs read team_members" ON public.team_members;
CREATE POLICY "AMs read team_members"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_legacy_assigned_am(client_id));

DROP POLICY IF EXISTS "clients manage own team_members" ON public.team_members;
CREATE POLICY "clients manage own team_members"
  ON public.team_members FOR ALL TO authenticated
  USING (public.is_client_primary_contact(client_id))
  WITH CHECK (public.is_client_primary_contact(client_id));