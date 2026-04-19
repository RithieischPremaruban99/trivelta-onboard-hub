-- MIGRATION 1: visitor registration
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_client_email_unique UNIQUE (client_id, email);

CREATE OR REPLACE FUNCTION public.register_onboarding_visitor(_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (client_id, email, client_role)
  SELECT _client_id, current_user_email(), 'client_member'
  FROM public.clients
  WHERE id = _client_id
  ON CONFLICT ON CONSTRAINT team_members_client_email_unique DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_onboarding_visitor(uuid) TO authenticated;

-- MIGRATION 2: broaden AM matching + policies
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

DROP POLICY IF EXISTS "AMs read forms of assigned" ON public.onboarding_forms;
CREATE POLICY "AMs read forms of assigned"
  ON public.onboarding_forms FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

DROP POLICY IF EXISTS "AMs read tasks of assigned" ON public.onboarding_tasks;
CREATE POLICY "AMs read tasks of assigned"
  ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

DROP POLICY IF EXISTS "AMs update tasks of assigned" ON public.onboarding_tasks;
CREATE POLICY "AMs update tasks of assigned"
  ON public.onboarding_tasks FOR UPDATE TO authenticated
  USING (public.is_assigned_am(client_id));

DROP POLICY IF EXISTS "AMs read submissions of assigned" ON public.form_submissions;
CREATE POLICY "AMs read submissions of assigned"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (public.is_assigned_am(client_id));

DROP POLICY IF EXISTS "AMs (multi) read team_members" ON public.team_members;
CREATE POLICY "AMs (multi) read team_members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'account_manager'::app_role)
    AND public.is_assigned_am(client_id)
  );

DROP POLICY IF EXISTS "members read own team_member row" ON public.team_members;
CREATE POLICY "members read own team_member row"
  ON public.team_members FOR SELECT TO authenticated
  USING (email = public.current_user_email());

DROP POLICY IF EXISTS "client members read their client" ON public.clients;
CREATE POLICY "client members read their client"
  ON public.clients FOR SELECT TO authenticated
  USING (
    public.is_client_team_member(id)
    OR public.is_client_primary_contact(id)
  );