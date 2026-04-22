-- Allow account_executive to insert/select/update prospects (was previously only admin + account_manager)
DROP POLICY IF EXISTS "Admins and AMs can create prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins and AMs can read prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins and AMs can update prospects" ON public.prospects;

CREATE POLICY "Admin AE AM can insert prospects" ON public.prospects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  );

CREATE POLICY "Admin AE AM can read prospects" ON public.prospects
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  );

CREATE POLICY "Admin AE AM can update prospects" ON public.prospects
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'account_executive'::public.app_role)
    OR public.has_role(auth.uid(), 'account_manager'::public.app_role)
  );