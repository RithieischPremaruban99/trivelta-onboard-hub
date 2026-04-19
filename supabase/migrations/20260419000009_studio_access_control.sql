-- Add studio_access_locked to clients table
-- When true: client cannot access Trivelta Studio (AM is implementing their design)
-- Default false = Studio open after form submission

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS studio_access_locked boolean NOT NULL DEFAULT false;

-- Policy: only account_manager, account_executive, admin can flip this flag
-- (client_owner/member have no UPDATE access to clients table at all by default)
DROP POLICY IF EXISTS "Staff can update studio_access_locked" ON public.clients;
CREATE POLICY "Staff can update studio_access_locked"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_manager') OR
    public.has_role(auth.uid(), 'account_executive')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'account_manager') OR
    public.has_role(auth.uid(), 'account_executive')
  );
