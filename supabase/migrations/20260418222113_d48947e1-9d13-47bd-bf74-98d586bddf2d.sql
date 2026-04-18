-- Add created_by column to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Trigger to auto-set created_by on insert
CREATE OR REPLACE FUNCTION public.set_client_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_client_created_by ON public.clients;
CREATE TRIGGER trg_set_client_created_by
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_client_created_by();

-- Seed role assignments for the 5 team members
INSERT INTO public.role_assignments (email, name, role) VALUES
  ('aidan.kidd@trivelta.com',           'Aidan Kidd',             'account_manager'),
  ('davi.sirohi@trivelta.com',          'Davi Sirohi',            'account_manager'),
  ('rithieisch.premaruban@trivelta.com','Rithieisch Premaruban',  'account_executive'),
  ('simone.bacchin@trivelta.com',       'Simone Bacchin',         'account_executive'),
  ('arthur.david@trivelta.com',         'Arthur David',           'account_executive')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;

-- Backfill: if any of these users already exist in auth, ensure they have the role row
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, ra.role
FROM auth.users u
JOIN public.role_assignments ra ON ra.email = u.email
WHERE ra.email IN (
  'aidan.kidd@trivelta.com',
  'davi.sirohi@trivelta.com',
  'rithieisch.premaruban@trivelta.com',
  'simone.bacchin@trivelta.com',
  'arthur.david@trivelta.com'
)
ON CONFLICT DO NOTHING;

-- Account-executive admin-equivalent policies
CREATE POLICY "AEs all clients"
ON public.clients FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs all team_members"
ON public.team_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs all tasks"
ON public.onboarding_tasks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs all forms"
ON public.onboarding_forms FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs all submissions"
ON public.form_submissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs manage role assignments"
ON public.role_assignments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs manage sop template"
ON public.sop_task_template FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'))
WITH CHECK (public.has_role(auth.uid(), 'account_executive'));

CREATE POLICY "AEs read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'account_executive'));

-- Also let AMs read all user_roles so they can build the AM dropdown if needed
CREATE POLICY "AMs read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'account_manager'));