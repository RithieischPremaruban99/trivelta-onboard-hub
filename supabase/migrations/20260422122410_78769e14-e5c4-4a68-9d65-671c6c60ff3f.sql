CREATE TABLE IF NOT EXISTS public.prospect_account_managers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  am_email    text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (prospect_id, am_email)
);

CREATE INDEX IF NOT EXISTS idx_prospect_ams_prospect ON public.prospect_account_managers(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_ams_email ON public.prospect_account_managers(am_email);

ALTER TABLE public.prospect_account_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see all prospect AMs" ON public.prospect_account_managers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','account_executive'))
  );

CREATE POLICY "AMs see their own prospect assignments" ON public.prospect_account_managers
  FOR SELECT USING (am_email = public.current_user_email());

INSERT INTO public.prospect_account_managers (prospect_id, am_email)
SELECT id, assigned_account_manager
FROM public.prospects
WHERE assigned_account_manager IS NOT NULL AND assigned_account_manager != ''
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "AMs see only their assigned prospects" ON public.prospects;
DROP POLICY IF EXISTS "AMs can delete assigned prospects" ON public.prospects;

CREATE POLICY "AMs see their assigned prospects" ON public.prospects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'account_manager')
    AND EXISTS (
      SELECT 1 FROM public.prospect_account_managers pam
      WHERE pam.prospect_id = prospects.id
      AND pam.am_email = public.current_user_email()
    )
  );

CREATE POLICY "AMs can delete their assigned prospects" ON public.prospects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'account_manager')
    AND EXISTS (
      SELECT 1 FROM public.prospect_account_managers pam
      WHERE pam.prospect_id = prospects.id
      AND pam.am_email = public.current_user_email()
    )
  );

CREATE POLICY "AMs can update their assigned prospects" ON public.prospects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'account_manager')
    AND EXISTS (
      SELECT 1 FROM public.prospect_account_managers pam
      WHERE pam.prospect_id = prospects.id
      AND pam.am_email = public.current_user_email()
    )
  );