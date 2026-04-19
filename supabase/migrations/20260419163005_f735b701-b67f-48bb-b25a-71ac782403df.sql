CREATE OR REPLACE FUNCTION public.is_am_for_client(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_account_managers
    WHERE client_id = _client_id
      AND (
        am_user_id = auth.uid()
        OR am_email = public.current_user_email()
      )
  );
$$;

DROP POLICY IF EXISTS "AMs read assignments of their clients" ON public.client_account_managers;
CREATE POLICY "AMs read assignments of their clients"
  ON public.client_account_managers FOR SELECT TO authenticated
  USING (
    am_user_id = auth.uid()
    OR am_email = public.current_user_email()
  );

DROP POLICY IF EXISTS "AMs (multi) read forms" ON public.onboarding_forms;
CREATE POLICY "AMs (multi) read forms"
  ON public.onboarding_forms FOR SELECT TO authenticated
  USING (public.is_am_for_client(client_id));

DROP POLICY IF EXISTS "AMs (multi) read tasks" ON public.onboarding_tasks;
CREATE POLICY "AMs (multi) read tasks"
  ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_am_for_client(client_id));

DROP POLICY IF EXISTS "AMs (multi) read submissions" ON public.form_submissions;
CREATE POLICY "AMs (multi) read submissions"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (public.is_am_for_client(client_id));

DROP POLICY IF EXISTS "AMs (multi) read team_members" ON public.team_members;
CREATE POLICY "AMs (multi) read team_members"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_am_for_client(client_id));

GRANT EXECUTE ON FUNCTION public.is_am_for_client(uuid) TO authenticated;