-- 1. Seed Alex Serrato
INSERT INTO public.role_assignments (email, name, role) VALUES
  ('alex.serrato@trivelta.com', 'Alex Serrato', 'account_manager')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;

-- If Alex already has an auth user, attach the role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'account_manager'::public.app_role
FROM auth.users u
WHERE u.email = 'alex.serrato@trivelta.com'
ON CONFLICT DO NOTHING;

-- 2. Junction table: client_account_managers
CREATE TABLE IF NOT EXISTS public.client_account_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  am_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (client_id, am_user_id)
);

CREATE INDEX IF NOT EXISTS idx_cam_client ON public.client_account_managers(client_id);
CREATE INDEX IF NOT EXISTS idx_cam_am ON public.client_account_managers(am_user_id);

ALTER TABLE public.client_account_managers ENABLE ROW LEVEL SECURITY;

-- Backfill from clients.assigned_am_id
INSERT INTO public.client_account_managers (client_id, am_user_id)
SELECT id, assigned_am_id FROM public.clients
WHERE assigned_am_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. RLS policies
CREATE POLICY "admins all client_ams"
ON public.client_account_managers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "AEs all client_ams"
ON public.client_account_managers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AMs read own assignments"
ON public.client_account_managers FOR SELECT TO authenticated
USING (am_user_id = auth.uid());

CREATE POLICY "AMs read assignments of their clients"
ON public.client_account_managers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_account_managers cam2
    WHERE cam2.client_id = client_account_managers.client_id
      AND cam2.am_user_id = auth.uid()
  )
);

CREATE POLICY "Clients read own client_ams"
ON public.client_account_managers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_account_managers.client_id
      AND c.primary_contact_email = public.current_user_email()
  )
);

-- 4. Update existing AM-scoped policies on related tables to also recognise the junction table
-- (We keep existing single-AM policies for backward-compat; add new ones that use the junction.)
CREATE POLICY "AMs (multi) read assigned clients"
ON public.clients FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'account_manager')
  AND EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = clients.id AND cam.am_user_id = auth.uid()
  )
);

CREATE POLICY "AMs (multi) update assigned clients"
ON public.clients FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'account_manager')
  AND EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = clients.id AND cam.am_user_id = auth.uid()
  )
);

CREATE POLICY "AMs (multi) read tasks"
ON public.onboarding_tasks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = onboarding_tasks.client_id AND cam.am_user_id = auth.uid()
  )
);

CREATE POLICY "AMs (multi) update tasks"
ON public.onboarding_tasks FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = onboarding_tasks.client_id AND cam.am_user_id = auth.uid()
  )
);

CREATE POLICY "AMs (multi) read forms"
ON public.onboarding_forms FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = onboarding_forms.client_id AND cam.am_user_id = auth.uid()
  )
);

CREATE POLICY "AMs (multi) read submissions"
ON public.form_submissions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = form_submissions.client_id AND cam.am_user_id = auth.uid()
  )
);

CREATE POLICY "AMs (multi) read team_members"
ON public.team_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_account_managers cam
    WHERE cam.client_id = team_members.client_id AND cam.am_user_id = auth.uid()
  )
);